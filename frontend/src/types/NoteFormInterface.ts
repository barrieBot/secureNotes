export interface INoteFormInterface {
    title: string;
    noteMsg: string;
    dirty: boolean;
    clear: () => void;
}