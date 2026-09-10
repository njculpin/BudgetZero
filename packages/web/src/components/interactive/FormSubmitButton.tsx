import { createSignal } from "solid-js";
import LoadingButton from "./LoadingButton";
import "./loading-button.css";

interface FormSubmitButtonProps {
  action: string;
  method?: "post" | "get";
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive" | "accent";
  size?: "sm" | "md" | "lg";
  children: string;
}

export default function FormSubmitButton(props: FormSubmitButtonProps) {
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.target as HTMLFormElement;

    try {
      const response = await fetch(props.action, {
        method: props.method || "post",
        headers: {
          "Accept": "application/json",
        },
        body: new FormData(form),
        redirect: 'manual', // Don't auto-follow redirects
      });

      // Handle redirect responses (3xx)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("Location");
        if (location) {
          window.location.href = location;
        } else {
          window.location.reload();
        }
        return;
      }

      if (response.ok) {
        // Check content type before parsing
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          // Parse JSON response
          const data = await response.json();

          // Check if there's a redirect URL in the response
          if (data.document && data.document.handle) {
            window.location.href = `/documents/${data.document.handle}`;
          } else if (data.product && data.product.handle) {
            window.location.href = `/products/${data.product.handle}`;
          } else {
            // If no specific redirect, reload the page
            window.location.reload();
          }
        } else {
          // Not JSON, just reload
          window.location.reload();
        }
      } else {
        // Handle error
        const contentType = response.headers.get("content-type");
        let errorMessage = "An error occurred. Please try again.";

        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => ({ error: errorMessage }));
          errorMessage = errorData.error || errorMessage;
        }

        console.error("Form submission error:", errorMessage);
        alert(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} action={props.action} method={props.method || "post"}>
      <LoadingButton
        type="submit"
        variant={props.variant || "primary"}
        size={props.size || "lg"}
        isLoading={isLoading()}
        loadingText={`${props.children}...`}
      >
        {props.children}
      </LoadingButton>
    </form>
  );
}
