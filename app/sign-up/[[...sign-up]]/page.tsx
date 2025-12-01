import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-950 dark:bg-[#171725] flex items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-900 border border-purple-500/20 shadow-2xl",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton: "bg-gray-800 border-purple-500/20 text-white hover:bg-gray-700",
            formButtonPrimary: "bg-purple-700 hover:bg-purple-800",
            formFieldInput: "bg-gray-800 border-purple-500/20 text-white",
            formFieldLabel: "text-gray-300",
            footerActionLink: "text-purple-500 hover:text-purple-400",
          },
        }}
      />
    </div>
  );
}

