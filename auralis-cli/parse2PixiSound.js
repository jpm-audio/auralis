const fs = require('fs');

fs.readFile('gameAudio.json', (err, data) => {
  if (err) throw err;
  const howler2Json = JSON.parse(data);

  const pixiSoundJson = {
    url: howler2Json.src,
    sprites: {},
  };

  for (let spriteName in howler2Json.sprite) {
    const start = howler2Json.sprite[spriteName][0];
    const end = start + howler2Json.sprite[spriteName][1];
    pixiSoundJson.sprites[spriteName] = {
      start: start / 1000,
      end: end / 1000,
    };
  }
  console.log(howler2Json);
  console.log(pixiSoundJson);

  fs.writeFile('gameAudio.json', JSON.stringify(pixiSoundJson), (err) => {
    if (err) throw err;
    console.log('Done!');
  });
});
