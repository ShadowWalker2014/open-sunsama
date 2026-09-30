import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createOpenSunsamaClient } from "@open-sunsama/api-client";
import { createReactHooks } from "@open-sunsama/api-client/react";
import { expect, it } from "vitest";

it("renders shared API hooks with the web app's React instance", () => {
  const api = createOpenSunsamaClient({ baseUrl: "http://localhost:3001" });
  const hooks = createReactHooks(api);

  function TasksProbe() {
    const { status } = hooks.useTasks(undefined, { enabled: false });
    return createElement("span", null, status);
  }

  const html = renderToString(
    createElement(
      QueryClientProvider,
      { client: new QueryClient() },
      createElement(TasksProbe)
    )
  );

  expect(html).toContain("pending");
});
