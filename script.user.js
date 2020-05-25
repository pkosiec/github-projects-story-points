// ==UserScript==
// @name         GitHub Projects Story Points
// @namespace    pkosiec
// @version      0.0.2
// @description  Use Story Points in GitHub Project board without a hassle. No labels or issue title modifications needed.
// @author       Pawel Kosiec
// @website      https://github.com/pkosiec/gh-projects-story-points/
// @match        https://github.com/*
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";
  
  const refreshTime = 3000;

  const storyPointsSummaryClass = "ghp-sp-story-points-summary";
  const notEstimatedCardClass = "ghp-sp-not-estimated";
  const invalidEstimationCardClass = "ghp-sp-estimation-invalid";
  const estimationBlockSelector = `pre[lang="est"]`;
  const columnSelector = ".project-column";
  const cardSelector = "article.issue-card";
  const customCSS = `
  ${cardSelector}.${notEstimatedCardClass} {
    background: #fff7bb!important;
  }

  ${cardSelector}.${invalidEstimationCardClass} {
    background: #fb6d6d!important;
    border: 1px solid red!important;
  }
`


  if (document.querySelector(".project-columns-container") === null) {
    return;
  }

  console.log("Running GitHub Projects Story Points...");
  includeCustomCSS();
  runPeriodically(refreshTime);

  function runPeriodically(refreshTime) {
    setInterval(() => {
      run();
    }, refreshTime);
  }

  function run() {
    removeExistingSummaries();

    const columnNodes = getColumnNodes();

    columnNodes.forEach((columnNode) => {
      const totalCardNodes = getTotalCardNodes(columnNode);
      const estimatedCardNodes = getEstimatedCardNodes(columnNode);

      highlightNotEstimatedCards(totalCardNodes);
      
      const columnStoryPointsStats = calculateStoryPointsStats(
        estimatedCardNodes,
        totalCardNodes
      );
      addStoryPointsColumnSummary(columnNode, columnStoryPointsStats);
    });
  }

  function removeExistingSummaries() {
    document
      .querySelectorAll(`.${storyPointsSummaryClass}`)
      .forEach((elem) => elem.remove());
  }

  function getColumnNodes() {
    return document.querySelectorAll(columnSelector);
  }

  function getEstimatedCardNodes(columnNode) {
    return columnNode.querySelectorAll(estimationBlockSelector);
  }

  function getTotalCardNodes(columnNode) {
    return columnNode.querySelectorAll(cardSelector);
  }

  function calculateStoryPointsStats(estimatedCardNodes, totalCardNodes) {
    let totalStoryPointsCount = 0;
    estimatedCardNodes.forEach((est) => {
      const estimationText = est.innerText.replace("SP:", "");
      const estNumber = Number(estimationText);

      if (isNaN(estNumber)) {
        return;
      }

      totalStoryPointsCount += estNumber;
    });

    const estimatedCardsCount = estimatedCardNodes.length;
    const totalCardsCount = totalCardNodes.length;

    return {
      totalStoryPointsCount,
      estimatedCardsCount,
      totalCardsCount,
    };
  }

  function highlightNotEstimatedCards(cardNodes) {
    cardNodes.forEach((node) => {
      const estimationCodeBlockNodes = node.querySelectorAll(estimationBlockSelector)
      if (estimationCodeBlockNodes.length === 0) {
        node.classList.add(notEstimatedCardClass)
        return;
      }

      if (estimationCodeBlockNodes.length > 1) {
        // invalid card
        node.classList.add(invalidEstimationCardClass)
        return;
      }
    });
  }

  function includeCustomCSS() {
    const styleNode = document.createElement('style');
    styleNode.type = 'text/css';
    styleNode.appendChild(document.createTextNode(customCSS))

    document.head.appendChild(styleNode)
  }

  function addStoryPointsColumnSummary(
    columnNode,
    { totalStoryPointsCount, estimatedCardsCount, totalCardsCount }
  ) {
    const projectColumnHeader = columnNode.querySelector(".details-container");

    const summaryDiv = document.createElement("div");
    summaryDiv.className = storyPointsSummaryClass;
    summaryDiv.style.padding = "8px";
    summaryDiv.innerHTML = `<p style="margin:0">
          <strong>Story Points:</strong> ${totalStoryPointsCount} (Estimated: ${estimatedCardsCount}/${totalCardsCount})
        </p>`;
    projectColumnHeader.appendChild(summaryDiv);
  }
})();
