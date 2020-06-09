// ==UserScript==
// @name         GitHub Projects Story Points
// @namespace    pkosiec
// @version      0.2.1
// @description  Use Story Points in GitHub Project board without a hassle. No labels or issue title modifications needed.
// @author       Pawel Kosiec
// @website      https://github.com/pkosiec/gh-projects-story-points/
// @match        https://github.com/*/projects/*
// @grant        none
// @license      MIT
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  /**
   * Configuration
   */
  const config = {
    // Interval when Story Points, custom styles etc. are recalculated
    refreshInterval: 1000,

    // Configuration for project board header
    boardHeader: {
      // show Story Points summary on top of the project board
      showTotalBoardStoryPoints: true,
    },

    // Configuration for project board cards
    cards: {
      // CSS style for not estimated cards. Leave empty if you don't want to override style.
      unestimatedCSS: `
        background: #fff7bb!important;
      `,

      // CSS Style for cards that have invalid estimation. Leave empty if you don't want to override style.
      invalidCSS: `
        background: #fbc8c8!important;
      `,

      // Customize cards based on its content. The following mapping is sample data you may customize for your needs.
      customMappings: [
        {
          // Action Items
          containsText: "[AI]",
          css: `background: #d2bbff!important;`,
        },
        {
          // Epics
          containsText: "[EPIC]",
          css: `background: #bbe3ff!important;`,
        },
        {
          // Technical Writer tasks which are unestimated, but they shouldn't be highlighted
          containsText: "[TW]",
          css: `background: #fff!important;`,
        },
      ],
    },

    // Configuration for project board columns
    columns: {
      // the column cards will be validated as usual and the column summary will be visible,
      // but the Story Points from this column won't be counted towards the board total Story Points.
      excludedFromBoardStoryPointsCount: ["Backlog"],

      // the column cards will be excluded from validation and counting Story Points:
      // both from column and board Story Points count.
      ignored: ["Inbox"],
    },
  };

  /**
   * Internal values, DO NOT MODIFY
   */

  const cssClassPrefix = "ghp-sp-";
  const storyPointsColumnSummaryClass = `${cssClassPrefix}column-summary`;
  const storyPointsBoardSummaryClass = `${cssClassPrefix}board-summary`;
  const unestimatedCardClass = `${cssClassPrefix}not-estimated`;
  const invalidEstimationCardClass = `${cssClassPrefix}estimation-invalid`;

  const estimationBlockSelector = `pre[lang="est"]`;
  const columnSelector = ".project-column";
  const columnHeaderSelector = ".details-container";
  const columnHeaderNameSelector = `${columnHeaderSelector} .js-project-column-name`;
  const cardSelector = "article.issue-card";
  const boardHeaderSelector = ".project-header .project-header-controls";
  const projectBoardSelector = ".project-columns-container";
  const customCSS = `
  ${cardSelector}.${unestimatedCardClass} {
    ${config.cards.unestimatedCSS}
  }
  
  ${cardSelector}.${invalidEstimationCardClass} {
    ${config.cards.invalidCSS}
  }

  ${config.cards.customMappings
    .map(
      ({ css }, i) =>
        `
    ${cardSelector}.${cssClassPrefix}custom-${i} {
      ${css}
    }
    `
    )
    .join("")}
  
  .${storyPointsColumnSummaryClass} {
    padding: 0 8px 8px;
  }
  
  .${storyPointsColumnSummaryClass} p, .${storyPointsBoardSummaryClass} p {
    margin: 0;
  }
  `;

  console.log(customCSS);
  class NoEstimationCardError extends Error {}
  class InvalidEstimationCardError extends Error {}

  class StoryPointer {
    constructor(config) {
      this.config = config;
    }

    runIfShould() {
      if (!this.shouldRun()) {
        return;
      }

      console.log("Running GitHub Projects Story Points...");
      this.includeCustomCSS();
      setInterval(() => {
        this.refresh();
      }, this.config.refreshInterval);
    }

    shouldRun() {
      return document.querySelector(projectBoardSelector) !== null;
    }

    refresh() {
      this.removeExistingSummaries();

      const columns = this.getColumns();

      let totalBoardStoryPoints = 0;
      columns.forEach((column) => {
        if (config.columns.ignored.includes(column.name)) {
          this.addExcludedLabelForColumnIfShould(column.node);
          return;
        }

        const cardNodes = this.getCardNodes(column.node);

        const totalCardNodesCount = cardNodes.length;
        let estimatedCardsCount = 0;
        let totalColumnStoryPoints = 0;
        cardNodes.forEach((cardNode) => {
          try {
            const cardStoryPoints = this.getCardStoryPoints(cardNode);
            totalColumnStoryPoints += cardStoryPoints;
            estimatedCardsCount++;
          } catch (err) {
            this.highlightCard(cardNode, err);
          }

          // move to another function
          const textContent = cardNode.textContent;
          const additionalCssClasses = this.config.cards.customMappings.map(
            (item, i) => {
              if (!textContent.includes(item.containsText)) {
                return;
              }

              return `${cssClassPrefix}custom-${i}`;
            },
            null
          );
          additionalCssClasses.forEach(
            (cssClass) => cssClass && cardNode.classList.add(cssClass)
          );
        });

        if (
          !this.config.columns.excludedFromBoardStoryPointsCount.includes(
            column.name
          )
        ) {
          totalBoardStoryPoints += totalColumnStoryPoints;
        }

        this.addStoryPointsColumnSummary(column.node, {
          totalColumnStoryPoints,
          estimatedCardsCount,
          totalCardNodesCount,
        });
      });

      if (this.config.boardHeader.showTotalBoardStoryPoints) {
        const boardHeaderNode = this.getBoardHeaderNode();
        this.addStoryPointsBoardSummary(boardHeaderNode, totalBoardStoryPoints);
      }
    }

    removeExistingSummaries() {
      document
        .querySelectorAll(`.${storyPointsColumnSummaryClass}`)
        .forEach((elem) => elem.remove());

      const boardSummaryNode = document.querySelector(
        `${boardHeaderSelector} .${storyPointsBoardSummaryClass}`
      );
      if (boardSummaryNode !== null) {
        boardSummaryNode.remove();
      }
    }

    getBoardHeaderNode() {
      return document.querySelector(boardHeaderSelector);
    }

    getColumns() {
      const columnNodes = document.querySelectorAll(columnSelector);
      const columnNodesArray = [...columnNodes];

      return columnNodesArray.map((columnNode) => {
        const headerNode = columnNode.querySelector(columnHeaderNameSelector);
        if (headerNode === null) {
          return {
            node: columnNode,
          };
        }

        return {
          node: columnNode,
          name: headerNode.innerText,
        };
      });
    }

    getCardNodes(columnNode) {
      return columnNode.querySelectorAll(cardSelector);
    }

    highlightCard(node, err) {
      switch (true) {
        case err instanceof NoEstimationCardError:
          node.classList.add(unestimatedCardClass);
          return;
        case err instanceof InvalidEstimationCardError:
          node.classList.add(invalidEstimationCardClass);
          return;
      }
    }

    getCardStoryPoints(node) {
      const estimationCodeBlockNodes = node.querySelectorAll(
        estimationBlockSelector
      );

      if (estimationCodeBlockNodes.length === 0) {
        throw new NoEstimationCardError();
      }

      if (estimationCodeBlockNodes.length > 1) {
        throw new InvalidEstimationCardError();
      }

      const storyPoints = this.getStoryPoints(estimationCodeBlockNodes[0]);
      if (storyPoints < 0) {
        throw new InvalidEstimationCardError();
      }

      return storyPoints;
    }

    getStoryPoints(estimationCodeBlockNode) {
      const estimationText = estimationCodeBlockNode.innerText.replace(
        "SP:",
        ""
      );
      const estNumber = Number(estimationText);

      if (isNaN(estNumber) || estNumber < 0) {
        return -1;
      }

      return estNumber;
    }

    includeCustomCSS() {
      const styleNode = document.createElement("style");
      styleNode.type = "text/css";
      styleNode.appendChild(document.createTextNode(customCSS));

      document.head.appendChild(styleNode);
    }

    addStoryPointsColumnSummary(
      columnNode,
      { totalColumnStoryPoints, estimatedCardsCount, totalCardNodesCount }
    ) {
      const projectColumnHeader = columnNode.querySelector(
        columnHeaderSelector
      );

      const summaryDiv = document.createElement("div");
      summaryDiv.className = storyPointsColumnSummaryClass;
      summaryDiv.innerHTML = `<p>
            <strong>Story Points:</strong> ${totalColumnStoryPoints} (Estimated: ${estimatedCardsCount}/${totalCardNodesCount})
          </p>`;
      projectColumnHeader.appendChild(summaryDiv);
    }

    addExcludedLabelForColumnIfShould(columnNode) {
      const projectColumnHeader = columnNode.querySelector(
        columnHeaderSelector
      );

      if (
        projectColumnHeader.querySelector(
          `.${storyPointsColumnSummaryClass}`
        ) !== null
      ) {
        return;
      }

      const excludedColumnDiv = document.createElement("div");
      excludedColumnDiv.className = storyPointsColumnSummaryClass;
      excludedColumnDiv.innerHTML = `<p>
            Story Points count disabled
          </p>`;
      projectColumnHeader.appendChild(excludedColumnDiv);
    }

    addStoryPointsBoardSummary(boardHeaderNode, totalBoardStoryPoints) {
      const summaryDiv = document.createElement("div");
      summaryDiv.className = storyPointsBoardSummaryClass;

      let additionalContent = "";
      if (
        this.config.columns.ignored.length > 0 ||
        this.config.columns.excludedFromBoardStoryPointsCount.length > 0
      ) {
        const ignoredColumns = [
          ...new Set([
            ...this.config.columns.ignored,
            ...this.config.columns.excludedFromBoardStoryPointsCount,
          ]),
        ];
        additionalContent = `<br/><small>Ignored columns: ${ignoredColumns.join(
          ", "
        )}</small>`;
      }

      summaryDiv.innerHTML = `<p>
            <strong>Board Story Points:</strong> ${totalBoardStoryPoints}${additionalContent}
          </p>`;

      boardHeaderNode.prepend(summaryDiv);
    }
  }

  const sp = new StoryPointer(config);
  sp.runIfShould();
})();
