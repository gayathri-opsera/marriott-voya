# WO-081: ECS Fargate task definitions and services for all platform components.
#
# Defines task definitions and ECS services for:
#   user-service, booking-service, payment-service, search-service,
#   ai-service, notification-service, auth-service, api-gateway,
#   ai-orchestration, car-service (10 services)
#
# Pattern: each service gets its own task definition, ECS service,
# target group, and ALB listener rule via for_each.

variable "environment"             { type = string }
variable "cluster_arn"             { type = string }
variable "vpc_id"                  { type = string }
variable "private_subnet_ids"      { type = list(string) }
variable "public_subnet_ids"       { type = list(string) }
variable "execution_role_arn"      { type = string }
variable "task_role_arn"           { type = string }
variable "ecr_registry"            { type = string }
variable "alb_listener_arn"        { type = string }
variable "alb_security_group_id"   { type = string }
variable "db_url_secret_arn"       { type = string }
variable "redis_url_secret_arn"    { type = string }
variable "stripe_secret_arn"       { type = string }
variable "jwt_secret_arn"          { type = string }
variable "kms_key_arn"             { type = string }
variable "region"                  { default = "us-east-1" }
variable "log_group"               { default = "/ecs" }

# ─── Service catalogue ─────────────────────────────────────────────────────────
# Each entry: name → { cpu, memory, port, path_prefix, desired_count, health_path }

locals {
  services = {
    "user-service" = {
      cpu           = 256
      memory        = 512
      port          = 3001
      path_prefix   = "/api/v1/users"
      desired_count = 2
      health_path   = "/health"
      priority      = 10
    }
    "auth-service" = {
      cpu           = 256
      memory        = 512
      port          = 3002
      path_prefix   = "/api/v1/auth"
      desired_count = 2
      health_path   = "/health"
      priority      = 11
    }
    "booking-service" = {
      cpu           = 512
      memory        = 1024
      port          = 3003
      path_prefix   = "/api/v1/bookings"
      desired_count = 2
      health_path   = "/health"
      priority      = 12
    }
    "payment-service" = {
      cpu           = 256
      memory        = 512
      port          = 3004
      path_prefix   = "/api/v1/payments"
      desired_count = 2
      health_path   = "/health"
      priority      = 13
    }
    "search-service" = {
      cpu           = 512
      memory        = 1024
      port          = 3005
      path_prefix   = "/api/v1/search"
      desired_count = 3
      health_path   = "/health"
      priority      = 14
    }
    "ai-service" = {
      cpu           = 1024
      memory        = 2048
      port          = 3006
      path_prefix   = "/api/v1/ai"
      desired_count = 2
      health_path   = "/health"
      priority      = 15
    }
    "ai-orchestration" = {
      cpu           = 512
      memory        = 1024
      port          = 3007
      path_prefix   = "/api/v1/ai/orchestrate"
      desired_count = 2
      health_path   = "/health"
      priority      = 16
    }
    "notification-service" = {
      cpu           = 256
      memory        = 512
      port          = 3008
      path_prefix   = "/api/v1/notifications"
      desired_count = 2
      health_path   = "/health"
      priority      = 17
    }
    "car-service" = {
      cpu           = 256
      memory        = 512
      port          = 3009
      path_prefix   = "/api/v1/cars"
      desired_count = 2
      health_path   = "/health"
      priority      = 18
    }
    "api-gateway" = {
      cpu           = 256
      memory        = 512
      port          = 3000
      path_prefix   = "/"
      desired_count = 2
      health_path   = "/health"
      priority      = 1
    }
  }
}

# ─── Security group for ECS tasks ─────────────────────────────────────────────

resource "aws_security_group" "ecs_tasks" {
  name        = "${var.environment}-ecs-tasks"
  description = "ECS tasks — allow ALB ingress only"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [var.alb_security_group_id]
    description     = "ALB → ECS tasks"
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all egress (egress allow-list enforced in app layer)"
  }
}

# ─── CloudWatch log groups ─────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "services" {
  for_each          = local.services
  name              = "${var.log_group}/${var.environment}/${each.key}"
  retention_in_days = 30
}

# ─── ECS task definitions ──────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "services" {
  for_each = local.services

  family                   = "${var.environment}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${var.ecr_registry}/${var.environment}/${each.key}:latest"
      essential = true

      portMappings = [{
        containerPort = each.value.port
        protocol      = "tcp"
      }]

      # AWS OTEL sidecar for distributed tracing (WO-010)
      dependsOn = [{
        containerName = "aws-otel-collector"
        condition     = "START"
      }]

      environment = [
        { name = "NODE_ENV",        value = var.environment == "production" ? "production" : "staging" },
        { name = "PORT",            value = tostring(each.value.port) },
        { name = "SERVICE_NAME",    value = each.key },
        { name = "AWS_REGION",      value = var.region },
        { name = "OTEL_EXPORTER_OTLP_ENDPOINT", value = "http://localhost:4318" },
      ]

      secrets = [
        { name = "DATABASE_URL",    valueFrom = var.db_url_secret_arn },
        { name = "REDIS_URL",       valueFrom = var.redis_url_secret_arn },
        { name = "JWT_SECRET",      valueFrom = var.jwt_secret_arn },
        { name = "KMS_KEY_ARN",     valueFrom = var.kms_key_arn },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services[each.key].name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = each.key
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -sf http://localhost:${each.value.port}${each.value.health_path} || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    },
    # ADOT sidecar (WO-010 compliance)
    {
      name      = "aws-otel-collector"
      image     = "public.ecr.aws/aws-observability/aws-otel-collector:latest"
      essential = false
      command   = ["--config=/etc/ecs/ecs-default-config.yaml"]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "${var.log_group}/${var.environment}/adot"
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "adot-${each.key}"
        }
      }
    }
  ])
}

# ─── ALB target groups ─────────────────────────────────────────────────────────

resource "aws_lb_target_group" "services" {
  for_each = local.services

  name        = "${var.environment}-${substr(each.key, 0, min(length(each.key), 20))}-tg"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = each.value.health_path
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  deregistration_delay = 30
}

# ─── ALB listener rules ────────────────────────────────────────────────────────

resource "aws_lb_listener_rule" "services" {
  for_each     = local.services
  listener_arn = var.alb_listener_arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = ["${each.value.path_prefix}*"]
    }
  }
}

# ─── ECS services ──────────────────────────────────────────────────────────────

resource "aws_ecs_service" "services" {
  for_each = local.services

  name                               = each.key
  cluster                            = var.cluster_arn
  task_definition                    = aws_ecs_task_definition.services[each.key].arn
  desired_count                      = each.value.desired_count
  launch_type                        = "FARGATE"
  platform_version                   = "LATEST"
  health_check_grace_period_seconds  = 60
  enable_execute_command             = var.environment != "production"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = "ECS"
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.services[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  lifecycle {
    ignore_changes = [desired_count, task_definition]  # Managed by CI/CD
  }
}

# ─── Outputs ───────────────────────────────────────────────────────────────────

output "service_arns" {
  value = { for k, v in aws_ecs_service.services : k => v.id }
}

output "task_definition_arns" {
  value = { for k, v in aws_ecs_task_definition.services : k => v.arn }
}

output "target_group_arns" {
  value = { for k, v in aws_lb_target_group.services : k => v.arn }
}
