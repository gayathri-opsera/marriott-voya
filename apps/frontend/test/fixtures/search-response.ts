/** @deprecated Use `./searchResponse` instead */
export {
  makeSearchResponse as mockSearchResponseFactory,
  bookableFlightOffer,
  illustrativeHotelOffer,
} from "./searchResponse";

import { makeSearchResponse } from "./searchResponse";

/** @deprecated Use `makeSearchResponse()` instead */
export const mockSearchResponse = makeSearchResponse();
