/**
 * Blood group compatibility map (RBC transfusion rules)
 * Key   → required blood group (patient)
 * Value → allowed donor blood groups
 */

const bloodCompatibilityMap = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],

  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],

  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],

  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/**
 * Returns array of donor blood groups compatible with required blood group
 * @param {string} requiredGroup
 */
function getCompatibleDonorGroups(requiredGroup) {
  return bloodCompatibilityMap[requiredGroup] || [];
}

module.exports = {
  getCompatibleDonorGroups,
};
