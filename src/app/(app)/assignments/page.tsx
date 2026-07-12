import { redirect } from "next/navigation";

/** Legacy route — cleaner assignments now live at /cleaners */
export default function AssignmentsRedirectPage() {
  redirect("/cleaners");
}
