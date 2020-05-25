// ==UserScript==
// @name         GitHub Projects Story Points
// @namespace    pkosiec
// @version      0.1.0
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

  // Script configuration
  const refreshTime = 3000;
  const highlightNotEstimatedCards = true;

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
`;

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
      const cardNodes = getCardNodes(columnNode);

      const totalCardNodesCount = cardNodes.length;
      let estimatedCardsCount = 0;
      let totalColumnStoryPoints = 0;
      cardNodes.forEach((cardNode) => {
        try {
          const cardStoryPoints = getCardStoryPoints(cardNode);
          totalColumnStoryPoints += cardStoryPoints;
          estimatedCardsCount++;
        } catch (err) {
          highlightCard(cardNode, err);
        }
      });

      addStoryPointsColumnSummary(columnNode, {
        totalColumnStoryPoints,
        estimatedCardsCount,
        totalCardNodesCount,
      });
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

  function getCardNodes(columnNode) {
    return columnNode.querySelectorAll(cardSelector);
  }

  function highlightCard(node, err) {
    switch (true) {
      case err instanceof NoEstimationCardError:
        if (highlightNotEstimatedCards) {
          node.classList.add(notEstimatedCardClass);
        }
        return;
      case err instanceof InvalidEstimationCardError:
        node.classList.add(invalidEstimationCardClass);
        return;
    }
  }

  class NoEstimationCardError extends Error {}
  class InvalidEstimationCardError extends Error {}

  function getCardStoryPoints(node) {
    const estimationCodeBlockNodes = node.querySelectorAll(
      estimationBlockSelector
    );

    if (estimationCodeBlockNodes.length === 0) {
      throw new NoEstimationCardError();
    }

    if (estimationCodeBlockNodes.length > 1) {
      throw new InvalidEstimationCardError();
    }

    const storyPoints = getStoryPoints(estimationCodeBlockNodes[0]);
    if (storyPoints < 0) {
      throw new InvalidEstimationCardError();
    }

    return storyPoints;
  }

  function getStoryPoints(estimationCodeBlockNode) {
    const estimationText = estimationCodeBlockNode.innerText.replace("SP:", "");
    const estNumber = Number(estimationText);

    if (isNaN(estNumber) || estNumber < 0) {
      return -1;
    }

    return estNumber;
  }

  function includeCustomCSS() {
    const styleNode = document.createElement("style");
    styleNode.type = "text/css";
    styleNode.appendChild(document.createTextNode(customCSS));

    document.head.appendChild(styleNode);
  }

  function addStoryPointsColumnSummary(
    columnNode,
    { totalColumnStoryPoints, estimatedCardsCount, totalCardNodesCount }
  ) {
    const projectColumnHeader = columnNode.querySelector(".details-container");

    const summaryDiv = document.createElement("div");
    summaryDiv.className = storyPointsSummaryClass;
    summaryDiv.style.padding = "8px";
    summaryDiv.innerHTML = `<p style="margin:0">
          <strong>Story Points:</strong> ${totalColumnStoryPoints} (Estimated: ${estimatedCardsCount}/${totalCardNodesCount})
        </p>`;
    projectColumnHeader.appendChild(summaryDiv);
  }
})();
