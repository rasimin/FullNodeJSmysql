/**
 * Sorts offices hierarchically (Parent -> Children) and adds indentation prefix for children.
 * @param {Array} offices - Array of office objects { id, name, parent_id }
 * @returns {Array} - Flattened hierarchical array with 'displayName' property
 */
export const formatOfficeHierarchy = (offices) => {
  if (!offices || !Array.isArray(offices)) return [];

  // 1. Separate parents and children
  const parents = offices.filter(o => !o.parent_id);
  const children = offices.filter(o => o.parent_id);

  const result = [];

  // 2. Sort parents alphabetically
  const sortedParents = [...parents].sort((a, b) => a.name.localeCompare(b.name));

  sortedParents.forEach(parent => {
    // Add Parent
    result.push({
      ...parent,
      displayName: parent.name,
      isParent: true
    });

    // Find and add children of this parent
    const myChildren = children
      .filter(c => c.parent_id === parent.id)
      .sort((a, b) => a.name.localeCompare(b.name));

    myChildren.forEach(child => {
      result.push({
        ...child,
        displayName: `\u00A0\u00A0\u00A0\u00A0— ${child.name}`,
        isParent: false
      });
    });
  });

  // 3. Handle any orphaned children (whose parents are not in the list)
  const addedIds = new Set(result.map(r => r.id));
  const orphans = offices.filter(o => !addedIds.has(o.id));
  
  if (orphans.length > 0) {
    orphans.sort((a, b) => a.name.localeCompare(b.name)).forEach(o => {
      result.push({
        ...o,
        displayName: o.name,
        isParent: false
      });
    });
  }

  return result;
};
