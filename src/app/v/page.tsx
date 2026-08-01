import { redirect } from "next/navigation";

// Route lama (/v) → redirect ke halaman workout yang baru
export default function OldWorkoutRedirect() {
  redirect("/workout");
}
