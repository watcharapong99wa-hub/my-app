import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HomeLanding } from "./landing-view";

// Logged-in users never see landing HTML - redirect before first paint,
// so fast scrolling can never catch a landing+dashboard mix.
export default async function HomePage() {
  const jar = await cookies();
  if (jar.get("kepup_session")?.value) {
    redirect("/app");
  }
  return <HomeLanding />;
}
