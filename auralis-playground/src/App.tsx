import { AudioLoader } from 'auralis';
import { useEffect, useRef, useState } from 'react';
import LoadButton from './components/LoadButton';
import { LoadState } from './types/LoadButton';

const App = (): JSX.Element => {
	const [encodedState, setEncodedState] = useState<LoadState>(LoadState.Waiting);
	const [spriteState, setSpriteState] = useState<LoadState>(LoadState.Waiting);
	const [bankState, setBankState] = useState<LoadState>(LoadState.Waiting);

	const audioContextRef = useRef<AudioContext | null>(null);
    const audioLoaderRef = useRef<AudioLoader | null>(null);

    useEffect(() => {
        // Inicializar una sola vez
        audioContextRef.current = new AudioContext();
        audioLoaderRef.current = new AudioLoader();
        audioLoaderRef.current.init(audioContextRef.current);

        // Cleanup al desmontar
        return () => {
            audioContextRef.current?.close();
        };
    }, []);

    const loadAudio = async (
        setState: (state: LoadState) => void,
        audioId: string,
        src: string
    ) => {
        if (!audioLoaderRef.current) return;

        setState(LoadState.Loading);
        
        try {
            await audioLoaderRef.current.loadAudio({
                type: 'single',
                id: audioId,
                src,
            });
            setState(LoadState.Loaded);
        } catch (error) {
            console.error('Error loading audio:', error);
            setState(LoadState.Waiting); // o crear un estado de Error
        }
    };

    const loadEncoded = () => loadAudio(setEncodedState, 'encoded-audio', './audio/encoded/buttons/button_down_0.ogg');
    const loadSprite = () => loadAudio(setSpriteState, 'sprite-audio', './audio/sprites/buttons.json');
    const loadBank = () => loadAudio(setBankState, 'bank-audio', './audio/banks/buttons.aurbank.meta.json');

    return (
        <div>
            <h1>Auralis Playground</h1>
            <div>
                <LoadButton loadState={encodedState} label="Load Encoded Audio" onClick={loadEncoded} />
                <LoadButton loadState={spriteState} label="Load Sprite Audio" onClick={loadSprite} />
				<LoadButton loadState={bankState} label="Load Bank Audio" onClick={loadBank} />
            </div>
        </div>
    );
};

export default App;
