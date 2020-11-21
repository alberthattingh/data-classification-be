
class Field {
    constructor(fieldNumber, fieldValue) {
        this.setNumber(fieldNumber);
        this.setValue(fieldValue);

        // Default
        this.setClassificationStatus(false);
        this.setClassifiedAs(null);
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

    setClassifiedAs(classification) {
        this.classifiedAs = classification;
    }
}

module.exports = Field;