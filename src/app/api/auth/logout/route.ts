import { logoutAction } from "@/lib/actions";

export async function POST() {
  await logoutAction();
}
