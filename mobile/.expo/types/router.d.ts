/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/forgot-password` | `/(auth)/login` | `/(auth)/register` | `/(auth)/welcome` | `/(tabs)` | `/(tabs)/communities` | `/(tabs)/create` | `/(tabs)/feed` | `/(tabs)/inbox` | `/(tabs)/profile` | `/_sitemap` | `/campus-map` | `/communities` | `/courses` | `/create` | `/edit-profile` | `/feed` | `/forgot-password` | `/inbox` | `/login` | `/polls` | `/professors` | `/profile` | `/register` | `/settings` | `/study-buddy` | `/timetable` | `/welcome`;
      DynamicRoutes: `/board/${Router.SingleRoutePart<T>}` | `/community/${Router.SingleRoutePart<T>}` | `/conversation/${Router.SingleRoutePart<T>}` | `/course/${Router.SingleRoutePart<T>}` | `/dm/${Router.SingleRoutePart<T>}` | `/post/${Router.SingleRoutePart<T>}` | `/professor/${Router.SingleRoutePart<T>}` | `/profile/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/board/[id]` | `/community/[id]` | `/conversation/[id]` | `/course/[id]` | `/dm/[id]` | `/post/[id]` | `/professor/[id]` | `/profile/[id]`;
    }
  }
}
