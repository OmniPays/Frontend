describe('Select tokens & input amount', () => {
  it('should navigate to swap', () => {
    cy.visit('/swap');
    cy.contains('You sell');
  });

  it('should select token in', () => {
    cy.visit('/swap');
    cy.get('[data-testid="swap__input__panel"]').within(() => {
      cy.get('[data-testid="swap__token__select"]').click();
    });
    cy.get('[data-testid="token-search-input"]').type('usdc');
    cy.get('[data-testid="currency__list__USDC"]').click();
  });

  it('should select token out', () => {
    cy.visit('/swap');
    cy.get('[data-testid="swap__output__panel"]').within(() => {
      cy.get('[data-testid="swap__token__select"]').click();
    });
    cy.get('[data-testid="token-search-input"]').type('xlm');
    cy.get('[data-testid="currency__list__XLM"]').click();
  });

  it('should type an input amount and wait for the calculated output', () => {
    cy.visit('/swap');
    cy.get('[data-testid="swap__input__panel"]').within(() => {
      cy.get('[data-testid="swap__token__select"]').click();
    });
    cy.get('[data-testid="token-search-input"]').type('usdc');
    cy.get('[data-testid="currency__list__USDC"]').click();

    cy.get('[data-testid="swap__output__panel"]').within(() => {
      cy.get('[data-testid="swap__token__select"]').click();
    });
    cy.get('[data-testid="currency__list__XLM"]').click();

    cy.get('[data-testid="swap__input__panel"]').within(() => {
      cy.get('.token-amount-input').type('32456');
    });

    cy.get('[data-testid="swap__output__panel"]').within(() => {
      cy.get('.token-amount-input')
        .should('not.have.value', '')
        .invoke('val')
        .should('have.length.greaterThan', 7);
    });
  });

  it('should display more details of the swap in dropdown', () => {
    cy.visit('/swap');
    cy.get('[data-testid="swap__input__panel"]').within(() => {
      cy.get('[data-testid="swap__token__select"]').click();
    });
    cy.get('[data-testid="token-search-input"]').type('usdc');
    cy.get('[data-testid="currency__list__USDC"]').click();

    cy.get('[data-testid="swap__output__panel"]').within(() => {
      cy.get('[data-testid="swap__token__select"]').click();
    });
    cy.get('[data-testid="currency__list__XLM"]').click();

    cy.get('[data-testid="swap__input__panel"]').within(() => {
      cy.get('.token-amount-input').type('32456');
    });

    cy.get('[data-testid="swap__output__panel"]').within(() => {
      cy.get('.token-amount-input').should('not.have.value', '');
    });

    cy.get('[data-testid="swap-details-header-row"]').click();

    cy.contains('Price Impact');
    cy.contains('Expected output');
    cy.contains('Path');

    cy.get('[data-testid="swap__details__priceImpact"]').should('contain', '%');
    cy.get('[data-testid="swap__details__expectedOutput"]').should('contain', 'XLM');
    cy.get('[data-testid="swap__details__path"]').should('contain', 'XLM');
    cy.get('[data-testid="swap__details__path"]').should('contain', 'USDC');
    cy.get('[data-testid="swap__details__platform"]').should('exist');
  });
});

describe('Input & output amount validation', () => {
  it('should keep input and output amounts in sync when tokens change', () => {
    cy.visit('/swap');
    cy.get('[data-testid="swap__output__panel"]').within(() => {
      cy.get('[data-testid="swap__token__select"]').click();
    });
    cy.get('[data-testid="token-search-input"]').type('usdc');
    cy.get('[data-testid="currency__list__USDC"]').click();

    cy.get('[data-testid="swap__input__panel"]').within(() => {
      cy.get('.token-amount-input').type('1');
    });

    cy.get('[data-testid="swap-output-input-panel"]')
      .should('not.have.value', '')
      .invoke('val')
      .then((outputAmount) => {
        cy.get('[data-testid="swap-input-input-panel"]').should('have.value', '1');

        cy.get('[data-testid="swap__input__panel"]').within(() => {
          cy.get('[data-testid="swap__token__select"]').click();
        });
        cy.get('[data-testid="token-search-input"]').type('usdc');
        cy.get('[data-testid="currency__list__USDC"]').click();

        cy.get('[data-testid="swap__output__panel"]').within(() => {
          cy.get('.token-amount-input').type('{backspace}{backspace}1');
        });

        cy.get('[data-testid="swap-input-input-panel"]')
          .should('not.have.value', '')
          .invoke('val')
          .then((inputAmount) => {
            const belowOutput = Math.floor(Number(outputAmount) * 0.5);
            const aboveOutput = Math.ceil(Number(outputAmount) * 1.5);
            expect(Number(inputAmount)).to.be.within(belowOutput, aboveOutput);
          });
      });
  });
});

describe('Slippage tolerance config', () => {
  it('should change slippage tolerance', () => {
    cy.visit('/swap');
    cy.get('[data-testid="open-settings-dialog-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').click();
    cy.get('[data-testid="slippage-input"]').type('1.05');
    cy.get('[data-testid="max-slippage-settings"]').contains('1.05%');
  });

  it('should display an alert if slippage is too high', () => {
    cy.visit('/swap');
    cy.get('[data-testid="open-settings-dialog-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').click();
    cy.get('[data-testid="slippage-input"]').type('10');
    cy.get('[data-testid="max-slippage-settings"]').contains('10%');
    cy.get('[data-testid="slippage-alert"]').should('exist');
    cy.get('[data-testid="slippage-alert-too-high"]').should('exist');
  });

  it('should display an alert if slippage is too low', () => {
    cy.visit('/swap');
    cy.get('[data-testid="open-settings-dialog-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').click();
    cy.get('[data-testid="slippage-input"]').type('0.01');
    cy.get('[data-testid="max-slippage-settings"]').contains('0.01%');
    cy.get('[data-testid="slippage-alert"]').should('exist');
    cy.get('[data-testid="slippage-alert-too-low"]').should('exist');
  });

  it('should keep the slippage tolerance after closing the settings', () => {
    cy.visit('/swap');
    cy.get('[data-testid="open-settings-dialog-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').click();
    cy.get('[data-testid="slippage-input"]').type('1.05');
    cy.get('[data-testid="open-settings-dialog-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').should('not.exist');
    cy.get('[data-testid="open-settings-dialog-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').should('exist');
    cy.get('[data-testid="max-slippage-settings"]').contains('1.05%');
  });

  it('should set the slippage tolerance to auto when pressing the auto button', () => {
    cy.visit('/swap');
    cy.get('[data-testid="open-settings-dialog-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').click();
    cy.get('[data-testid="slippage-input"]').type('1.05');
    cy.get('[data-testid="max-slippage-settings"]').contains('1.05%');
    cy.get('[data-testid="slippage-auto-button"]').click();
    cy.get('[data-testid="max-slippage-settings"]').contains('Auto');
  });
});

describe('Navigation flow', () => {
  it('should render the navbar', () => {
    cy.visit('/');
    cy.get('[data-testid="navbar__container"]').should('exist');
  });

  it('should navigate to balances', () => {
    cy.visit('/');
    cy.get('[data-testid="navbar__container"]').click();
    cy.contains('Balance').click();
    cy.contains("Your token's balance:");
  });

  it('should navigate to swap', () => {
    cy.visit('/');
    cy.get('[data-testid="navbar__container"]').click();
    cy.contains('Swap').click();
    cy.contains('You sell');
  });

  it('should navigate to liquidity', () => {
    cy.visit('/');
    cy.get('[data-testid="navbar__container"]').click();
    cy.contains('Liquidity').click();
    cy.contains('List of your liquidity positions');
  });

  it('should navigate to info', () => {
    cy.visit('/');
    cy.get('[data-testid="navbar__container"]').click();
    cy.contains('Info').click();
    cy.url().should('match', /https:\/\/info\.soroswap\.finance\//);
  });
});
