import { LoadState } from "../types/LoadButton";

interface LoadButtonProps {
    label: string;
    loadState: LoadState;
    onClick: () => void;
}

const LoadButton = ({ label, loadState, onClick }: LoadButtonProps): JSX.Element => {
    return (
        <div>
            <div>{label}</div>
            <button
                type="button"
                onClick={onClick}
                disabled={loadState !== LoadState.Waiting}
            >
                {loadState === LoadState.Waiting && 'Load Audio'}
                {loadState === LoadState.Loading && 'Loading...'}
                {loadState === LoadState.Loaded && 'Done'}
                {loadState === LoadState.Error && 'Error'}
            </button>
        </div>
    );
};

export default LoadButton;
