import { redirect } from "next/navigation";

/** Legacy route — SOW templates now live at /sows */
export default function SowTemplatesRedirectPage() {
  redirect("/sows");
}
