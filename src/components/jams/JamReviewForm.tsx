import type { JamProductReview } from "@/types";
import "./jam-review-form.css";

export interface JamReviewFormProps {
  jamId: string;
  jamTitle: string;
  productId: string;
  existingReview?: JamProductReview | null;
}

export default function JamReviewForm(props: JamReviewFormProps) {
  return (
    <form method="post" action="/api/jams/add-review" class="jam-review-form">
      <input type="hidden" name="jam_id" value={props.jamId} />
      <input type="hidden" name="product_id" value={props.productId} />

      <div class="jam-review-form__field">
        <label for="rating" class="jam-review-form__label">
          Rating
        </label>
        <select
          id="rating"
          name="rating"
          class="jam-review-form__select"
          required
        >
          <option value="">Select a rating</option>
          <option
            value="5"
            selected={props.existingReview?.review_rating === 5}
          >
            ⭐⭐⭐⭐⭐ Exceptional
          </option>
          <option
            value="4"
            selected={props.existingReview?.review_rating === 4}
          >
            ⭐⭐⭐⭐ Great
          </option>
          <option
            value="3"
            selected={props.existingReview?.review_rating === 3}
          >
            ⭐⭐⭐ Good
          </option>
          <option
            value="2"
            selected={props.existingReview?.review_rating === 2}
          >
            ⭐⭐ Fair
          </option>
          <option
            value="1"
            selected={props.existingReview?.review_rating === 1}
          >
            ⭐ Needs Improvement
          </option>
        </select>
      </div>

      <div class="jam-review-form__field">
        <label for="review_text" class="jam-review-form__label">
          Your Review
        </label>
        <textarea
          id="review_text"
          name="review_text"
          class="jam-review-form__textarea"
          rows="6"
          placeholder="What did you think about this product? How well does it fit the jam theme?"
          required
        >
          {props.existingReview?.review_text || ""}
        </textarea>
      </div>

      <button type="submit" class="jam-review-form__button">
        {props.existingReview ? "Update Review" : "Submit Review"}
      </button>
    </form>
  );
}
