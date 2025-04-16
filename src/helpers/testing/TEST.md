# Gherkin-Style Arrange-Act-Assert Testing Guide

## Core Principle: One Action Per Test

The fundamental rule is that **each test should verify exactly one action or behavior**, though you may have multiple assertions to verify the results of that action.

## Basic Structure

### The AAA Pattern Mapped to Gherkin

| AAA Pattern | Gherkin Syntax | Purpose                                                     |
| ----------- | -------------- | ----------------------------------------------------------- |
| **Arrange** | **Given**      | Set up the test preconditions                               |
| **Act**     | **When**       | Execute the single action being tested                      |
| **Assert**  | **Then**       | Verify the expected outcomes (can have multiple assertions) |

## Key Components

### Given (Arrange)

- **Purpose**: Establish the preconditions needed for the test
- **Format**: "Given I have..." or "Given I am..."
- **Note**: Can have multiple `Given` statements, preferably use `And` for following ones

### When (Act)

- **Purpose**: Execute precisely one action being tested
- **Format**: "When I [do]..."
- **Rule**: Each test should have exactly one `When` statement

### Then (Assert)

- **Purpose**: Verify the expected outcomes of the action
- **Format**: "Then I see..." or "Then I should see..."
- **Note**: Can have multiple `Then` or `And` statements for different aspects of verification

## Best Practices

1. **Focus on one action** - The "When" should capture a single behavior under test
2. **Complete setup in Given** - All prerequisites should be in the "Given" section
3. **Verify all consequences** - Use multiple assertions if needed to fully verify the action's results
4. **Use behavior-oriented language** - Write tests in terms that anyone can understand without reading the code
5. **Keep actions atomic** - If you find yourself wanting multiple "When" statements, split into separate tests

## Implementation Example

```javascript
describe('Wizard Duel', () => {
  test('casting a lightning bolt', () => {
    // Given I am a wizard
    const wizard = createWizard('Me');
    // And I have a wizard opponent
    const opponent = createWizard('Merlin');
    // And I have sufficient mana for a lightning spell
    const wizard.mana = 100;

    // When I cast a lightning bolt at my opponent
    wizard.castLightningBolt(opponent);

    // Then I should see that my mana decreased
    expect(wizard.health).toBeLessThan(100);
    // And I should see that my opponent's health decreased
    expect(opponent.health).toBeLessThan(100);
    // And the lightning-bolt effect should appear on the opponent
    expect(spellEffectsLog).toContainEqual({
      spell: 'lightning-bolt',
      target: opponent.name,
    });
  });
});
```

## Anti-patterns to Avoid

1. ❌ **Multiple actions in one test** - Never have more than one "When" step
2. ❌ **Assertions in Given or When** - Keep assertions only in the "Then" section (checks required by the type system are allowed)
3. ❌ **Testing unrelated behaviors together** - Create separate tests for different actions
4. ❌ **Missing prerequisites** - Ensure all needed setup is done in "Given"
5. ❌ **Incomplete verification** - Check all relevant outcomes of the action, that don't require extra actions
