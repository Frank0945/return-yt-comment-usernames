const APP_ID = "return-yt-comment-usernames";
const COMMENT_URL = [
  "https://www.youtube.com/youtubei/v1/next",
  "https://www.youtube.com/youtubei/v1/browse",
];
const FEED_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=";

const hideHandle =
  window.localStorage.getItem("hideHandle") === "true" ? true : false;

const interceptFetch = () => {
  const { fetch: origFetch } = window;

  window.fetch = async (...args) => {
    const response = await origFetch(...args);

    if (!response.ok) {
      return response;
    }

    if (!COMMENT_URL.some((url) => response.url.includes(url))) {
      return response;
    }

    const responseClone = response.clone();

    const json = await responseClone.json();

    const mutations: Array<any> =
      json?.frameworkUpdates?.entityBatchUpdate?.mutations;

    if (!mutations?.some((m) => m?.payload?.commentEntityPayload)) {
      return response;
    }

    await updateAuthors(json.frameworkUpdates.entityBatchUpdate.mutations);

    const updatedResponse = new Response(JSON.stringify(json), {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });

    return updatedResponse;
  };
};

const updateAuthors = async (mutations: any[]): Promise<any> => {
  try {
    const promises = mutations.map(async (m: any) => {
      const channelId = m.payload.commentEntityPayload.author.channelId;
      const cName = await getChannelName(channelId);

      if (cName !== null) {
        const dName = m.payload.commentEntityPayload.author.displayName;
        const pTime = m.payload.commentEntityPayload.properties.publishedTime;

        if (!hideHandle) {
          m.payload.commentEntityPayload.properties.publishedTime = `${dName}．${pTime}`;
        }
        m.payload.commentEntityPayload.author.displayName = cName;
      }
      return m;
    });
    return await Promise.allSettled(promises);
  } catch (error) {
    console.error(`[${APP_ID}]: Error updating authors:`, error);
    return Promise.reject(error);
  }
};

const getChannelName = async (channelId: string): Promise<string | null> => {
  try {
    const response = await fetch(FEED_URL + channelId, {
      cache: "default",
      keepalive: true,
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const xml = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");

    const titleElement = doc.querySelector("title");
    const title = titleElement ? titleElement.textContent : null;

    if (title === null) {
      throw new Error("Channel title not found");
    }

    return title;
  } catch (error) {
    console.error(`[${APP_ID}]: Error fetching channel name:`, error);
    return null;
  }
};

interceptFetch();
