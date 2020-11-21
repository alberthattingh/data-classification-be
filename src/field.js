
class Field {
    constructor(fieldNumber, fieldValue) {
        this.setNumber(fieldNumber);
        this.setValue(fieldValue);

        // Default
        this.setClassificationStatus(false);
        this.setCategory(null);
    }

    setNumber(num) {
        this.number = num;
    }

    setValue(val) {
        this.value = val;
    }

    setClassificationStatus(status) {
        this.isClassified = status;
    }

    setCategory(classification) {
        this.category = classification;
    }
}

module.exports = Field;