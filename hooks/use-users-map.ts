"use client";

import { User } from "@/services/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { getAllUsersOptions } from "../services/client/@tanstack/react-query.gen";

export type UserMap = Record<string, User>;

export function useUsersMap(page = 0, pageSize = 1000) {
  const { data, isLoading } = useQuery(
    getAllUsersOptions({
      query: { pageable: { page, size: pageSize } },
    })
  );

  const userMap = useMemo(() => {
    if (!data?.data?.content) return {};

    return data.data.content.reduce((acc: UserMap, user: User) => {
      if (user?.uuid) acc[user.uuid] = user;
      return acc;
    }, {});
  }, [data]);

  return {
    userMap,
    usersList: data?.data?.content || [],
    isLoading,
  };
}
