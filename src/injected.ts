const APP_ID = "return-yt-comment-usernames";
const COMMENT_URL = [
  "https://www.youtube.com/youtubei/v1/next",
  "https://www.youtube.com/youtubei/v1/browse",
];
const FEED_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=";

const interceptFetch = () => {
  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    const response = await originalFetch(input, init);

    if (
      !(input instanceof Request) ||
      !COMMENT_URL.some((url) => input.url.includes(url))
    ) {
      return response;
    }

    // const startTime = performance.now();

    const json = await response.json();

    await updateAuthors(json.frameworkUpdates.entityBatchUpdate.mutations);

    const updatedJsonString = JSON.stringify(json);

    const updatedResponse = new Response(updatedJsonString, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // const fetchTime = performance.now() - startTime;
    // console.log(`[${APP_ID}]: Fetch time: ${fetchTime} ms`);

    return updatedResponse;
  };
};

const updateAuthors = async (mutations: any[]) => {
  try {
    const promises = mutations.map(async (m: any) => {
      if (m.payload.commentEntityPayload) {
        const channelId = m.payload.commentEntityPayload.author.channelId;

        if (channelId) {
          const cName = await getChannelName(channelId);

          if (cName !== null) {
            const dName = m.payload.commentEntityPayload.author.displayName;
            const pTime =
              m.payload.commentEntityPayload.properties.publishedTime;

            m.payload.commentEntityPayload.properties.publishedTime = `${dName}．${pTime}`;
            m.payload.commentEntityPayload.author.displayName = cName;
          }
        }
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error(`[${APP_ID}]: Error updating authors:`, error);
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
