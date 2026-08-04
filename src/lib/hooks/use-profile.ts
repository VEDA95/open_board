import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from '@lib/query-keys';
import {
  changePasswordFunc,
  getMyProfileFunc,
  updateProfileFunc,
  uploadAvatarFunc
} from '@lib/server-functions/profile';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { MyProfile, Profile } from '@lib/server-functions/profile';

export const myProfileQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.myProfile,
    queryFn: () => getMyProfileFunc()
  });

export function useMyProfile(): UseQueryResult<MyProfile> {
  return useQuery(myProfileQueryOptions());
}

type UpdateProfileInput = Parameters<typeof updateProfileFunc>[0];
type ChangePasswordInput = Parameters<typeof changePasswordFunc>[0];

export function useProfileMutations(): {
  updateProfile: UseMutationResult<Profile, Error, UpdateProfileInput>;
  changePassword: UseMutationResult<void, Error, ChangePasswordInput>;
  uploadAvatar: (file: File) => void;
  isUploadingAvatar: boolean;
} {
  const queryClient = useQueryClient();
  const invalidate = (): void => {
    queryClient.invalidateQueries({ queryKey: queryKeys.myProfile });
  };
  const onError = (error: Error): void => {
    toast.error(error.message);
  };

  const updateProfile = useMutation({
    mutationFn: updateProfileFunc,
    onSuccess: (): void => {
      invalidate();
      toast.success('Profile updated');
    },
    onError
  });
  const changePassword = useMutation({
    mutationFn: changePasswordFunc,
    onSuccess: (): void => {
      toast.success('Password changed');
    },
    onError
  });
  const uploadAvatar = useMutation({
    mutationFn: uploadAvatarFunc,
    onSuccess: (): void => {
      invalidate();
      toast.success('Avatar updated');
    },
    onError
  });

  return {
    updateProfile,
    changePassword,
    uploadAvatar: (file: File): void => {
      const formData = new FormData();
      formData.append('file', file);
      uploadAvatar.mutate({ data: formData });
    },
    isUploadingAvatar: uploadAvatar.isPending
  };
}
