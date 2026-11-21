import type { Review } from "./types";
/** Label shown under a review, so guests know where it came from. */
export const reviewSource = (r: Review) => ({ direct: "Verified stay", google: "Google review", booking: "Booking.com review", tripadvisor: "Tripadvisor review" })[r.source ?? "direct"];
