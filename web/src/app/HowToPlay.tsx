import React from 'react';

const candyImages = [
  "assets/newcards/air.PNG",
  "assets/newcards/bck.PNG",
  "assets/newcards/bnk.PNG",
  "assets/newcards/fre.PNG",
  "assets/newcards/snc.PNG",
  "assets/newcards/jls.PNG",
  "assets/newcards/jto.PNG",
  "assets/newcards/nyl.PNG",
  "assets/newcards/ott.PNG",
  "assets/newcards/thn.PNG",
  "assets/newcards/tts.PNG",
  "assets/newcards/unr.PNG",
  "assets/newcards/wtr.PNG"
];

const matchGif = "assets/animations/burn.gif";
const catGif = "assets/CAT.gif";
const successGif = "assets/SUCCESS.gif";
const sonicLogo = "assets/soniclogo.avif";

export function HowToPlay() {
  return (
    <div className="how-to-play">      
      <section className="instructions">
        <div className="instruction-item">
          <img src={matchGif} alt="Match Cards" />
          <div>
            <h2>Match Cards</h2>
            <p>Combine three or more cards of the same type in a row or column to crush them and get a point per card crushed. Special cards can be matched, and when crushed apply special rules as shown below!</p>
          </div>
        </div>

        <div className="instruction-item">
          <img src={catGif} alt="Level System" />
          <div>
            <h2>Level Progression System</h2>
            <p>Complete levels to unlock the next challenge. Each level has a unique board layout based on its seed. As you progress through levels, you'll earn SONIC tokens as rewards. Harder levels offer greater rewards!</p>
          </div>
        </div>

        <div className="instruction-item">
          <img src={successGif} alt="Submit Scores" />
          <div>
            <h2>Submit Scores</h2>
            <p>After completing your moves, submit your score on-chain to track your progress and collect SONIC rewards. Your completed levels and scores are recorded on the Sonic blockchain and displayed in your Progress tab.</p>
          </div>
        </div>

        <div className="instruction-item">
          <img src={sonicLogo} alt="SONIC Rewards" />
          <div>
            <h2>SONIC Rewards</h2>
            <p>Earn SONIC tokens for each level you complete! We've allocated a total of 42 SONIC tokens per player as rewards across all levels, with later levels offering higher rewards. Your total earned SONIC is displayed in your Progress tab. This will be distributed once the Mobius hackathon completes.</p>
          </div>
        </div>
      </section>

      <section className="special-cards">
        <h2>Special Cards</h2>
        <div className="special-card">
          <img src={candyImages[2]} alt="Bonk Card" />
          <div>
            <h3>Bonk Card</h3>
            <p>Crushes a whole row or column.</p>
          </div>
        </div>
        <div className="special-card">
          <img src={candyImages[6]} alt="Jito Card" />
          <div>
            <h3>Jito Card</h3>
            <p>Grants an extra turn.</p>
          </div>
        </div>
        <div className="special-card">
          <img src={candyImages[9]} alt="Electric Card" />
          <div>
            <h3>Electric Card</h3>
            <p>Crushes all electric cards it can touch.</p>
          </div>
        </div>
        <div className="special-card">
          <img src={candyImages[12]} alt="Water Card" />
          <div>
            <h3>Water Card</h3>
            <p>Flows downwards crushing water cards.</p>
          </div>
        </div>
        <div className="special-card">
          <img src={candyImages[0]} alt="Air Card" />
          <div>
            <h3>Air Card</h3>
            <p>Flows upwards crushing air cards.</p>
          </div>
        </div>
        <div className="special-card">
          <img src={candyImages[3]} alt="Fire Card" />
          <div>
            <h3>Fire Card</h3>
            <p>Crushes surrounding cards 1 grid position away.</p>
          </div>
        </div>
      </section>

      <section className="hackathon-info">
        <h2>Mobius Hackathon</h2>
        <p>Card Crush is competing in the Sonic Mobius Hackathon with the following prize pool:</p>
        <ul className="prize-list">
          <li><strong>1st Place</strong> – $80,000</li>
          <li><strong>2nd Place</strong> – $50,000</li>
          <li><strong>3rd Place</strong> – $20,000</li>
          <li>50% in stablecoins</li>
          <li>10% in unlocked $SONIC</li>
          <li>40% in $SONIC with a 12-month vesting schedule</li>
        </ul>
        <div className="community-support">
          <h3>Support Us!</h3>
          <p>If we win, we'll distribute 69% of our unlocked SONIC tokens to players who played the game! Help us win by following and interacting with us on Twitter:</p>
          <a 
            href="https://x.com/CardCrushSONIC" 
            target="_blank" 
            rel="noopener noreferrer"
            className="twitter-link"
          >
            @CardCrushSONIC
          </a>
          <p className="mt-2">Your support makes a huge difference in the hackathon results!</p>
        </div>
      </section>
    </div>
  );
};