export interface RulebookTemplate {
  id: string
  name: string
  description: string
  category: 'board-game' | 'card-game' | 'rpg' | 'miniature-game' | 'other'
  content: string
  sections: string[]
}

export const rulebookTemplates: RulebookTemplate[] = [
  {
    id: 'board-game-basic',
    name: 'Basic Board Game',
    description: 'A standard template for traditional board games with setup, gameplay, and winning conditions.',
    category: 'board-game',
    sections: ['Overview', 'Components', 'Setup', 'Gameplay', 'Winning', 'Variants'],
    content: `
      <h1>Game Rules</h1>

      <h2>Overview</h2>
      <p>Describe your game in a few sentences. What is the theme? What are players trying to accomplish?</p>

      <h2>Components</h2>
      <ul>
        <li>Game board</li>
        <li>Player pieces</li>
        <li>Cards (specify how many and types)</li>
        <li>Dice</li>
        <li>Tokens or markers</li>
        <li>Other components</li>
      </ul>

      <h2>Setup</h2>
      <ol>
        <li>Place the game board in the center of the table</li>
        <li>Each player chooses a color and takes the corresponding pieces</li>
        <li>Shuffle the cards and deal X to each player</li>
        <li>Place remaining cards as a draw pile</li>
        <li>Set up any other components as shown in the diagram</li>
      </ol>

      <h2>Gameplay</h2>
      <p>Players take turns clockwise starting with the youngest player.</p>

      <h3>Turn Structure</h3>
      <p>On your turn, you must:</p>
      <ol>
        <li>Action 1</li>
        <li>Action 2</li>
        <li>Action 3</li>
      </ol>

      <h3>Special Rules</h3>
      <p>Explain any special mechanics, interactions, or edge cases.</p>

      <h2>Winning</h2>
      <p>The first player to achieve [victory condition] wins the game.</p>

      <h2>Variants</h2>
      <p>Optional rules for different play styles or player counts.</p>
    `
  },
  {
    id: 'card-game-basic',
    name: 'Basic Card Game',
    description: 'Template for card-based games with hand management and trick-taking elements.',
    category: 'card-game',
    sections: ['Overview', 'Components', 'Setup', 'Gameplay', 'Scoring', 'Winning'],
    content: `
      <h1>Card Game Rules</h1>

      <h2>Overview</h2>
      <p>A card game for 2-4 players. Players compete to [objective] using a deck of [number] cards.</p>

      <h2>Components</h2>
      <ul>
        <li>[Number] playing cards</li>
        <li>Score pad and pencil</li>
        <li>Reference cards (optional)</li>
      </ul>

      <h2>Card Types</h2>
      <table>
        <tr>
          <th>Card Type</th>
          <th>Quantity</th>
          <th>Function</th>
        </tr>
        <tr>
          <td>Type 1</td>
          <td>X cards</td>
          <td>Description of function</td>
        </tr>
        <tr>
          <td>Type 2</td>
          <td>Y cards</td>
          <td>Description of function</td>
        </tr>
      </table>

      <h2>Setup</h2>
      <ol>
        <li>Shuffle the deck thoroughly</li>
        <li>Deal X cards to each player</li>
        <li>Place remaining cards face down as the draw pile</li>
        <li>Turn the top card face up to start the discard pile</li>
      </ol>

      <h2>Gameplay</h2>
      <p>Players take turns in clockwise order.</p>

      <h3>Turn Actions</h3>
      <p>On your turn, you may:</p>
      <ul>
        <li>Draw a card from the draw pile or discard pile</li>
        <li>Play cards from your hand</li>
        <li>Discard a card to end your turn</li>
      </ul>

      <h2>Scoring</h2>
      <p>At the end of each round, players score points based on:</p>
      <ul>
        <li>Cards in hand (penalty points)</li>
        <li>Sets collected (bonus points)</li>
        <li>Special achievements</li>
      </ul>

      <h2>Winning</h2>
      <p>The game ends when [end condition]. The player with the [highest/lowest] score wins.</p>
    `
  },
  {
    id: 'rpg-basic',
    name: 'RPG Rulebook',
    description: 'Template for role-playing games with character creation, game mechanics, and GM guidance.',
    category: 'rpg',
    sections: ['Introduction', 'Character Creation', 'Game Mechanics', 'Combat', 'Magic', 'GM Guidelines'],
    content: `
      <h1>RPG Core Rules</h1>

      <h2>Introduction</h2>
      <p>Welcome to [Game Name], a tabletop role-playing game set in [setting description]. Players take on the roles of [character types] in a world of [themes and genres].</p>

      <h3>What You Need to Play</h3>
      <ul>
        <li>2-6 players (including 1 Game Master)</li>
        <li>Polyhedral dice (d4, d6, d8, d10, d12, d20)</li>
        <li>Character sheets</li>
        <li>Paper and pencils</li>
      </ul>

      <h2>Character Creation</h2>
      <h3>Step 1: Choose a Race</h3>
      <p>Select from the available races, each with unique traits and abilities.</p>

      <h3>Step 2: Choose a Class</h3>
      <p>Your class determines your character's role and abilities.</p>

      <h3>Step 3: Assign Attributes</h3>
      <p>Distribute points among the six core attributes:</p>
      <ul>
        <li><strong>Strength:</strong> Physical power and melee combat</li>
        <li><strong>Dexterity:</strong> Agility and ranged combat</li>
        <li><strong>Constitution:</strong> Health and endurance</li>
        <li><strong>Intelligence:</strong> Reasoning and knowledge</li>
        <li><strong>Wisdom:</strong> Perception and insight</li>
        <li><strong>Charisma:</strong> Force of personality and social skills</li>
      </ul>

      <h2>Core Mechanics</h2>
      <h3>Basic Resolution</h3>
      <p>To attempt an action, roll a d20 and add relevant modifiers. Compare the result to a Difficulty Class (DC) set by the GM.</p>

      <h3>Advantage and Disadvantage</h3>
      <p>Roll two d20s and take the higher (advantage) or lower (disadvantage) result.</p>

      <h2>Combat</h2>
      <h3>Initiative</h3>
      <p>Roll d20 + Dexterity modifier to determine turn order.</p>

      <h3>Actions</h3>
      <p>On your turn, you can:</p>
      <ul>
        <li>Move up to your speed</li>
        <li>Take one action (attack, cast spell, etc.)</li>
        <li>Take one bonus action (if available)</li>
        <li>Take any number of free actions</li>
      </ul>

      <h2>Magic</h2>
      <p>Spells are organized into levels 1-9. Casters have spell slots that limit how many spells they can cast per day.</p>

      <h2>Game Master Guidelines</h2>
      <h3>Setting DCs</h3>
      <table>
        <tr>
          <th>Difficulty</th>
          <th>DC</th>
        </tr>
        <tr>
          <td>Easy</td>
          <td>10</td>
        </tr>
        <tr>
          <td>Medium</td>
          <td>15</td>
        </tr>
        <tr>
          <td>Hard</td>
          <td>20</td>
        </tr>
        <tr>
          <td>Very Hard</td>
          <td>25</td>
        </tr>
      </table>

      <h3>Running the Game</h3>
      <p>Tips for creating engaging adventures and managing the table.</p>
    `
  },
  {
    id: 'miniature-game-basic',
    name: 'Miniature Wargame',
    description: 'Template for tactical miniature games with army building and battlefield tactics.',
    category: 'miniature-game',
    sections: ['Introduction', 'Army Building', 'Setup', 'Movement', 'Combat', 'Victory Conditions'],
    content: `
      <h1>Miniature Wargame Rules</h1>

      <h2>Introduction</h2>
      <p>[Game Name] is a tactical miniature wargame for 2+ players. Command armies of [unit types] in strategic battles across diverse battlefields.</p>

      <h3>What You Need</h3>
      <ul>
        <li>Miniature armies (each player needs [point value] points)</li>
        <li>6-sided dice</li>
        <li>Measuring tape or ruler</li>
        <li>Gaming table (minimum 4' x 4')</li>
        <li>Terrain pieces</li>
        <li>Army list sheets</li>
      </ul>

      <h2>Army Building</h2>
      <p>Build your army using the point values listed in the unit profiles. Standard games use [X] points.</p>

      <h3>Army Composition</h3>
      <ul>
        <li><strong>Core Units:</strong> Minimum [X] points, maximum [Y] points</li>
        <li><strong>Elite Units:</strong> Maximum [Z] points</li>
        <li><strong>Support Units:</strong> Maximum [W] points</li>
        <li><strong>Characters:</strong> Minimum 1, maximum [V]</li>
      </ul>

      <h2>Pre-Game Setup</h2>
      <ol>
        <li>Set up terrain mutually</li>
        <li>Roll for deployment zones</li>
        <li>Deploy armies alternately</li>
        <li>Roll for first turn</li>
      </ol>

      <h2>Game Turn Sequence</h2>
      <ol>
        <li><strong>Command Phase:</strong> Issue orders and check morale</li>
        <li><strong>Movement Phase:</strong> Move units according to their speed</li>
        <li><strong>Shooting Phase:</strong> Resolve ranged attacks</li>
        <li><strong>Combat Phase:</strong> Resolve melee combat</li>
        <li><strong>End Phase:</strong> Apply ongoing effects</li>
      </ol>

      <h2>Movement</h2>
      <h3>Movement Types</h3>
      <ul>
        <li><strong>March:</strong> Move up to full speed</li>
        <li><strong>Run:</strong> Move 1.5x speed, cannot shoot</li>
        <li><strong>Charge:</strong> Move toward enemy for combat</li>
      </ul>

      <h2>Combat Resolution</h2>
      <h3>Shooting</h3>
      <ol>
        <li>Check range and line of sight</li>
        <li>Roll to hit using unit's skill</li>
        <li>Roll to wound based on weapon strength vs. target toughness</li>
        <li>Apply armor saves</li>
        <li>Remove casualties</li>
      </ol>

      <h3>Melee Combat</h3>
      <p>Similar to shooting but units fight in initiative order.</p>

      <h2>Victory Conditions</h2>
      <p>Games typically last 6 turns. Victory is determined by:</p>
      <ul>
        <li>Destroying enemy units (points based on unit value)</li>
        <li>Controlling objectives</li>
        <li>Completing scenario-specific goals</li>
      </ul>
    `
  },
  {
    id: 'party-game-basic',
    name: 'Party Game',
    description: 'Template for social party games with simple rules and high player interaction.',
    category: 'other',
    sections: ['Overview', 'Components', 'Setup', 'Gameplay', 'Winning', 'Party Variants'],
    content: `
      <h1>Party Game Rules</h1>

      <h2>Overview</h2>
      <p>A hilarious party game for 4-12 players that combines [mechanics] with lots of laughs and social interaction.</p>

      <h2>Components</h2>
      <ul>
        <li>[Number] cards</li>
        <li>Timer</li>
        <li>Score pad</li>
        <li>Any special components</li>
      </ul>

      <h2>Setup</h2>
      <ol>
        <li>Sit in a circle where everyone can see each other</li>
        <li>Shuffle the cards and place them in the center</li>
        <li>Choose a starting player</li>
        <li>Set the timer nearby</li>
      </ol>

      <h2>How to Play</h2>
      <p>The game is played in rounds. Each round, one player is the [role] while others are [other role].</p>

      <h3>Round Structure</h3>
      <ol>
        <li>Draw a card and read it aloud</li>
        <li>Start the timer ([X] seconds/minutes)</li>
        <li>Players perform the activity described on the card</li>
        <li>Award points based on success/creativity</li>
        <li>Pass the role to the next player</li>
      </ol>

      <h3>Special Rules</h3>
      <ul>
        <li>No pointing or verbal hints (unless the card allows it)</li>
        <li>Players can pass if they're stuck</li>
        <li>Bonus points for exceptional performance</li>
      </ul>

      <h2>Scoring</h2>
      <ul>
        <li>Successful guess/performance: [X] points</li>
        <li>Bonus achievements: [Y] points</li>
        <li>Special card effects: Varies</li>
      </ul>

      <h2>Winning</h2>
      <p>Play until each player has been the [main role] [X] times, or until someone reaches [score] points.</p>

      <h2>Party Variants</h2>
      <h3>Team Play</h3>
      <p>Divide into teams of 2-3 players. Teams take turns and share points.</p>

      <h3>Speed Round</h3>
      <p>Reduce timer to [X] seconds for rapid-fire fun.</p>

      <h3>Adult Version</h3>
      <p>Add drinking rules or adult-themed cards for mature audiences.</p>
    `
  }
]

export function getTemplateById(id: string): RulebookTemplate | undefined {
  return rulebookTemplates.find(template => template.id === id)
}

export function getTemplatesByCategory(category: string): RulebookTemplate[] {
  return rulebookTemplates.filter(template => template.category === category)
}

export function getAllTemplates(): RulebookTemplate[] {
  return rulebookTemplates
}