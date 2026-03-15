/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(auth)/register` | `/(auth)/welcome` | `/(tabs)` | `/(tabs)/communities` | `/(tabs)/create` | `/(tabs)/feed` | `/(tabs)/inbox` | `/(tabs)/profile` | `/_sitemap` | `/communities` | `/courses` | `/create` | `/feed` | `/inbox` | `/login` | `/professors` | `/profile` | `/register` | `/study-buddy` | `/timetable` | `/welcome`;
      DynamicRoutes: `/board/${Router.SingleRoutePart<T>}` | `/community/${Router.SingleRoutePart<T>}` | `/conversation/${Router.SingleRoutePart<T>}` | `/course/${Router.SingleRoutePart<T>}` | `/post/${Router.SingleRoutePart<T>}` | `/professor/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/board/[id]` | `/community/[id]` | `/conversation/[id]` | `/course/[id]` | `/post/[id]` | `/professor/[id]`;
    }
  }
}
