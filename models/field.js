
class Field {
    constructor(fieldNumber, fieldValue) {
        this.setNumber(fieldNumber);
        this.setValue(fieldValue);

        // Default
        this.setClassificationStatus(false);
        this.setClassifiedAs(null);
        this.setName(null);
    }

    setNumber(num) {
        this.number = num;
    }

    setName(name) {
        this.name = name;
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