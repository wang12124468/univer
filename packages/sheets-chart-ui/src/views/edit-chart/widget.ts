const map = new Map();

export function registerComponent(id: string, component: any) {
    console.log('registerComponent', id);
    map.set(getComponentKey(id), component);
}

export function getComponent(id: string) {
    console.log('getComponent', id);
    return map.get(getComponentKey(id));
}

function getComponentKey(id: string) {
    return `sheets-chart-ui.edit-chart.${id}`;
}