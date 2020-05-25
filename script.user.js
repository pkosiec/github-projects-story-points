// ==UserScript==
// @name         GitHub Projects Story Points
// @namespace    pkosiec
// @version      0.0.1
// @description  Calculate Story Points for columns in GitHub Projects. Use `esp` codeblock with `SP: X` in project cards
// @author       Pawel Kosiec
// @website      https://github.com/pkosiec/gh-projects-story-points/
// @match        https://github.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
    "use strict";
  
    const storyPointsSummaryClass = "story-points-summary";
    const refreshTime = 3000;
  
    runPeriodically(refreshTime);
  
    function runPeriodically(refreshTime) {
      setInterval(() => {
      console.log("Run");
        run();
      }, refreshTime);
    }
  
    function run() {
      removeExistingSummaries();
  
      const columnNodes = getColumnNodes();
  
      columnNodes.forEach((columnNode) => {
        const columnStoryPointsStats = calculateStoryPointsStats(columnNode);
        console.log(columnStoryPointsStats);
        addStoryPointsColumnSummary(columnNode, columnStoryPointsStats);
      });
    }
  
    function removeExistingSummaries() {
      document
        .querySelectorAll(`.${storyPointsSummaryClass}`)
        .forEach((elem) => elem.remove());
    }
  
    function getColumnNodes() {
      return document.querySelectorAll(".project-column");
    }
  
    function calculateStoryPointsStats(columnNode) {
      const estimations = columnNode.querySelectorAll('pre[lang="est"');
  
      let totalStoryPointsCount = 0;
      estimations.forEach((est) => {
        const estimationText = est.innerText.replace("SP:", "");
        const estNumber = Number(estimationText);
  
        if (isNaN(estNumber)) {
          return;
        }
  
        totalStoryPointsCount += estNumber;
      });
  
      const estimatedCardsCount = estimations.length;
      const totalCardsCount = columnNode.querySelectorAll("article.issue-card")
        .length;
  
      return {
        totalStoryPointsCount,
        estimatedCardsCount,
        totalCardsCount,
      };
    }
  
    function addStoryPointsColumnSummary(
      columnNode,
      { totalStoryPointsCount, estimatedCardsCount, totalCardsCount }
    ) {
      const projectColumnHeader = columnNode.querySelector(".details-container");
  
      const summaryDiv = document.createElement("div");
      summaryDiv.className = storyPointsSummaryClass;
      summaryDiv.innerHTML = `<p style="padding: 8px;margin:0"><strong>Story Points:</strong> ${totalStoryPointsCount} (Estimated: ${estimatedCardsCount}/${totalCardsCount})</p>`;
      projectColumnHeader.appendChild(summaryDiv);
    }
  })();
  