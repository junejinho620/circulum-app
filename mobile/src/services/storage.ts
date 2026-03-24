import { createClient } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// ─── Supabase client ────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUCKETS = {
  avatars: 'avatars',
  posts: 'post-images',
  messages: 'message-images',
} as const;

type BucketName = keyof typeof BUCKETS;

// ─── Pick image from library ────────────────────────────────────────────────
export async function pickImage(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
    quality: options?.quality ?? 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

// ─── Take photo with camera ────────────────────────────────────────────────
export async function takePhoto(options?: {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: options?.allowsEditing ?? true,
    aspect: options?.aspect ?? [1, 1],
    quality: options?.quality ?? 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

// ─── Upload image to Supabase Storage ───────────────────────────────────────
export async function uploadImage(
  localUri: string,
  bucket: BucketName,
  userId: string,
): Promise<string | null> {
  try {
    // Generate unique filename
    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    // Read file as blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    // Determine content type
    const contentType = ext === 'png' ? 'image/png'
      : ext === 'gif' ? 'image/gif'
      : ext === 'webp' ? 'image/webp'
      : 'image/jpeg';

    // Upload to Supabase
    const { error } = await supabase.storage
      .from(BUCKETS[bucket])
      .upload(filename, blob, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage
      .from(BUCKETS[bucket])
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return null;
  }
}

// ─── Upload avatar (convenience wrapper) ────────────────────────────────────
export async function uploadAvatar(
  localUri: string,
  userId: string,
): Promise<string | null> {
  return uploadImage(localUri, 'avatars', userId);
}

// ─── Upload post images (multiple) ──────────────────────────────────────────
export async function uploadPostImages(
  uris: string[],
  userId: string,
): Promise<string[]> {
  const results = await Promise.all(
    uris.map((uri) => uploadImage(uri, 'posts', userId)),
  );
  return results.filter((url): url is string => url !== null);
}

// ─── Delete image from Supabase Storage ─────────────────────────────────────
export async function deleteImage(
  publicUrl: string,
  bucket: BucketName,
): Promise<boolean> {
  try {
    // Extract path from public URL
    const bucketName = BUCKETS[bucket];
    const pathMatch = publicUrl.split(`${bucketName}/`)[1];
    if (!pathMatch) return false;

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([pathMatch]);

    return !error;
  } catch {
    return false;
  }
}
