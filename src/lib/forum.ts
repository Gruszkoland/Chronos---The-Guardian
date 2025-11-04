export interface ForumPost {
  id: string;
  userId: string;
  username: string;
  title: string;
  content: string;
  timestamp: string;
}

export async function fetchForumPosts(userId: string): Promise<ForumPost[]> {
  try {
    const response = await fetch(`https://YOUR_VERCEL_DEPLOYMENT_URL.vercel.app/api/forum?userId=${userId}`); // ZASTĄP TEN ADRES URL!
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch forum posts: ${response.statusText}`);
    }
    const data: ForumPost[] = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching forum posts:", error);
    throw error;
  }
}