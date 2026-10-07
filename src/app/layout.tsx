import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plowline — run your business, not your spreadsheets",
  description:
    "Calendar, clients, payments and insights for service businesses. Demo with snow plowing data.",
};

// Runs before first paint so the saved theme never flashes the wrong colors.
const themeScript = `try{var s=JSON.parse(localStorage.getItem("plowline.settings")||"{}");var t=s.theme||"light";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
