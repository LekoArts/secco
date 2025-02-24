export const command = 'packages [packageNames...]'
export const desc = 'Specify list of packages you want to link'
export const builder = {
  packageNames: {
    array: true,
  },
}
export function handler() {}
