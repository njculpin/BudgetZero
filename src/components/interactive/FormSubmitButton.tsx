import { createSignal } from "solid-js";
import LoadingButton from "./LoadingButton";

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
        body: new FormData(form),
      });

      if (response.ok) {
        // Redirect to the response URL or handle success
        const redirectUrl = response.url;
        if (redirectUrl && redirectUrl !== window.location.href) {
          window.location.href = redirectUrl;
        } else {
          // If no redirect, reload the page
          window.location.reload();
        }
      } else {
        // Handle error - for now just reload
        setIsLoading(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Form submission error:", error);
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
