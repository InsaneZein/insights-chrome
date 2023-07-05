/**
 * Function that will register a location observer which will trigger an action after document.location.href change.
 * We can't use "popstate" event listener because react apps are not using browser history but custom router history implementaion
 * which are not using history go, push, pop functions that trigger popstate event.
 * @param {Function} observeCallback callback that will be triggered after URL change
 */

import chromeState, {LastVisitedPage} from "@redhat-cloud-services/chrome/ChromeProvider/chromeState";
import { post, get, LAST_VISITED_URL } from "@redhat-cloud-services/chrome/utils/fetch"
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import useBundle from "../hooks/useBundle";

const registerAnalyticsObserver = () => {
  /**
   * We ignore hash changes
   * Hashes only have frontend effect
   */
  let oldHref = document.location.href.replace(/#.*$/, '');

  const useLastPageVisitedUploader = (providerState: ReturnType<typeof chromeState>, bundle = '') => {
    const { pathname } = useLocation();
    useEffect(() => {
        post<LastVisitedPage[], { pathname: string; title: string; bundle: string }>(LAST_VISITED_URL, {
          pathname,
          title: document.title,
          bundle,
        })
          .then((data) => providerState.setLastVisited(data))
          .catch((error) => console.error('Unable to update last visited pages!', error));
    }, [pathname]);
  };

  window.onload = function () {
    const { bundleTitle } = useBundle();

    const bodyList = document.body;
    const providerState = useRef<ReturnType<typeof chromeState>>();
    if (!providerState.current) {
      providerState.current = chromeState();
    }
    useLastPageVisitedUploader(providerState.current, bundleTitle)
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function () {
        const newLocation = document.location.href.replace(/#.*$/, '');
        if (oldHref !== newLocation && window.sendCustomEvent) {
          oldHref = newLocation;
          window.sendCustomEvent('pageBottom');
        }
      });
    });
    const config = {
      childList: true,
      subtree: true,
    };
    observer.observe(bodyList, config);
  };
};

export default registerAnalyticsObserver;
