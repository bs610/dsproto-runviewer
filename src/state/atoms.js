import { atom } from 'recoil'

export const viewState = atom({
    key: 'view',
    default: {
        setup: 2,
        runNumber: null,
        runId: null,
        total: null
    }
})