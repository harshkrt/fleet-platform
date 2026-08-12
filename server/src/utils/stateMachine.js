// this is the core logic of two drivers can't accept the same ride request at the same time

const ALLOWED_TRANSITIONS = {
    'REQUESTED': ['ACCEPTED', 'CANCELLED'],
    'ACCEPTED': ['DRIVER_ARRIVING', 'CANCELLED'],
    'DRIVER_ARRIVING': ['STARTED', 'CANCELLED'],
    'STARTED': ['COMPLETED'],
    'COMPLETED': [],
    'CANCELLED': []
};

 export const isValidTransition = (curr, next) => {
    return ALLOWED_TRANSITIONS[curr]?.includes(next) || false;
};
