import { useSession, signIn, signOut } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  type LoginInput, 
} from "@/lib/validations";
import { userService } from "@/services/user.service";

export const useCurrentUser = () => {
  const { data: session, status } = useSession();
  return {
    data: session?.user,
    isLoading: status === "loading",
    status,
  };
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await signOut({ callbackUrl: "/login" });
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};
