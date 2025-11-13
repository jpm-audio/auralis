import { AudioLoader } from "auralis";

const App = (): JSX.Element => {
	const handleButton1Click = async () => {
		const audioContext = new AudioContext();
		const loader = new AudioLoader();
		loader.init(audioContext);
		console.log('Cargando audio...');
		await loader.loadAudio({
			type: 'single',
			id: 'example-audio',
			src: './audio/wav/button_down_0.wav',
		});
		console.log('Audio cargado con éxito.');
		const buffer = loader.getBuffer('example-audio');
		
		// Reproducir el buffer usando Web Audio API
		if (buffer) {
			console.log('Reproduciendo audio...');
			const source = audioContext.createBufferSource();
			source.buffer = buffer;
			source.connect(audioContext.destination);
			source.start();
		} else {
			console.error('No se pudo obtener el buffer de audio');
		}
	};

	const handleButton2Click = () => {
		// Función vacía - definir acción más tarde
	};

	return (
		<div>
			<h1>Auralis Playground</h1>
			<div>
				<button type="button" onClick={handleButton1Click}>
					Botón 1
				</button>
				<button type="button" onClick={handleButton2Click}>
					Botón 2
				</button>
			</div>
		</div>
	);
};

export default App;
