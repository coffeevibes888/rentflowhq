type WizardStep = 'review' | 'sign' | 'confirm';

interface SignatureField {
  id: string;
  type: 'signature' | 'initial';
  label: string;
  sectionContext: string;
  required: boolean;
  value: string | null;
  completed: boolean;
}

interface SessionProgress {
  token: string;
  completedFieldIds: string[];
  signatureData: string | null;
  initialsData: string | null;
  lastUpdated: Date;
}

class SigningWizardStateMachine {
  currentStep: WizardStep = 'review';
  currentFieldIndex: number = 0;
  fields: SignatureField[] = [];
  
  constructor(initialFields: SignatureField[] = []) {
    this.fields = initialFields.map(f => ({ ...f }));
  }

  get completedFields(): Set<string> {
    return new Set(this.fields.filter(f => f.completed).map(f => f.id));
  }

  get completedCount(): number {
    return this.completedFields.size;
  }

  get totalRequiredFields(): number {
    return this.fields.filter(f => f.required).length;
  }

  get isAllFieldsComplete(): boolean {
    return this.fields.filter(f => f.required).every(f => f.completed);
  }

  get progressPercentage(): number {
    if (this.totalRequiredFields === 0) return 0;
    return Math.round((this.completedCount / this.totalRequiredFields) * 100);
  }

  get currentField(): SignatureField | null {
    return this.fields[this.currentFieldIndex] || null;
  }

  goToStep(step: WizardStep): boolean {
    if (step === 'confirm' && !this.isAllFieldsComplete) {
      return false;
    }
    this.currentStep = step;
    return true;
  }

  goToReview(): boolean { return this.goToStep('review'); }
  goToSign(): boolean { return this.goToStep('sign'); }
  goToConfirm(): boolean { return this.goToStep('confirm'); }

  nextField(): boolean {
    if (this.currentFieldIndex < this.fields.length - 1) {
      this.currentFieldIndex++;
      return true;
    }
    return false;
  }

  prevField(): boolean {
    if (this.currentFieldIndex > 0) {
      this.currentFieldIndex--;
      return true;
    }
    return false;
  }

  goToField(index: number): boolean {
    if (index >= 0 && index < this.fields.length) {
      this.currentFieldIndex = index;
      return true;
    }
    return false;
  }

  goToFieldById(fieldId: string): boolean {
    const index = this.fields.findIndex(f => f.id === fieldId);
    if (index !== -1) {
      this.currentFieldIndex = index;
      return true;
    }
    return false;
  }

  completeField(fieldId: string, value: string): void {
    const idx = this.fields.findIndex(f => f.id === fieldId);
    if (idx !== -1) {
      this.fields[idx] = { ...this.fields[idx], value, completed: true };
    }
  }

  uncompleteField(fieldId: string): void {
    const idx = this.fields.findIndex(f => f.id === fieldId);
    if (idx !== -1) {
      this.fields[idx] = { ...this.fields[idx], value: null, completed: false };
    }
  }

  saveProgress(token: string): SessionProgress {
    return {
      token,
      completedFieldIds: Array.from(this.completedFields),
      signatureData: null,
      initialsData: null,
      lastUpdated: new Date(),
    };
  }

  loadProgress(progress: SessionProgress): void {
    this.fields = this.fields.map(field => ({
      ...field,
      completed: progress.completedFieldIds.includes(field.id),
    }));
  }

  reset(): void {
    this.currentStep = 'review';
    this.currentFieldIndex = 0;
    this.fields = this.fields.map(f => ({ ...f, value: null, completed: false }));
  }
}

const mockFields: SignatureField[] = [
  { id: 'init1', type: 'initial', label: 'Section 1', sectionContext: 'Terms', required: true, value: null, completed: false },
  { id: 'init2', type: 'initial', label: 'Section 2', sectionContext: 'Pet', required: true, value: null, completed: false },
  { id: 'sig', type: 'signature', label: 'Signature', sectionContext: 'Final', required: true, value: null, completed: false },
];

describe('Property 16: Wizard State Machine Transitions', () => {
  test('starts at review step', () => {
    const w = new SigningWizardStateMachine(mockFields);
    expect(w.currentStep).toBe('review');
  });

  test('allows review to sign', () => {
    const w = new SigningWizardStateMachine(mockFields);
    expect(w.goToSign()).toBe(true);
    expect(w.currentStep).toBe('sign');
  });

  test('blocks review to confirm', () => {
    const w = new SigningWizardStateMachine(mockFields);
    expect(w.goToConfirm()).toBe(false);
    expect(w.currentStep).toBe('review');
  });

  test('blocks sign to confirm when incomplete', () => {
    const w = new SigningWizardStateMachine(mockFields);
    w.goToSign();
    expect(w.goToConfirm()).toBe(false);
  });

  test('allows sign to confirm when complete', () => {
    const w = new SigningWizardStateMachine(mockFields);
    w.goToSign();
    w.completeField('init1', 'x');
    w.completeField('init2', 'x');
    w.completeField('sig', 'x');
    expect(w.goToConfirm()).toBe(true);
  });
});

describe('Property 21: Session Progress Persistence', () => {
  test('saves completed field IDs', () => {
    const w = new SigningWizardStateMachine(mockFields);
    w.completeField('init1', 'x');
    const p = w.saveProgress('tok');
    expect(p.completedFieldIds).toContain('init1');
  });

  test('restores completed fields', () => {
    const w = new SigningWizardStateMachine(mockFields);
    w.loadProgress({ token: 't', completedFieldIds: ['init1', 'init2'], signatureData: null, initialsData: null, lastUpdated: new Date() });
    expect(w.completedFields.has('init1')).toBe(true);
    expect(w.completedFields.has('init2')).toBe(true);
  });

  test('reset clears progress', () => {
    const w = new SigningWizardStateMachine(mockFields);
    w.completeField('init1', 'x');
    w.reset();
    expect(w.completedFields.size).toBe(0);
  });
});

describe('Property 18: Field Completion Checklist Accuracy', () => {
  test('tracks completed count', () => {
    const w = new SigningWizardStateMachine(mockFields);
    expect(w.completedCount).toBe(0);
    w.completeField('init1', 'x');
    expect(w.completedCount).toBe(1);
  });

  test('calculates progress percentage', () => {
    const w = new SigningWizardStateMachine(mockFields);
    expect(w.progressPercentage).toBe(0);
    w.completeField('init1', 'x');
    expect(w.progressPercentage).toBe(33);
    w.completeField('init2', 'x');
    expect(w.progressPercentage).toBe(67);
    w.completeField('sig', 'x');
    expect(w.progressPercentage).toBe(100);
  });

  test('identifies all fields complete', () => {
    const w = new SigningWizardStateMachine(mockFields);
    expect(w.isAllFieldsComplete).toBe(false);
    w.completeField('init1', 'x');
    w.completeField('init2', 'x');
    w.completeField('sig', 'x');
    expect(w.isAllFieldsComplete).toBe(true);
  });
});

describe('Field Navigation', () => {
  test('navigates next/prev', () => {
    const w = new SigningWizardStateMachine(mockFields);
    expect(w.currentFieldIndex).toBe(0);
    w.nextField();
    expect(w.currentFieldIndex).toBe(1);
    w.prevField();
    expect(w.currentFieldIndex).toBe(0);
  });

  test('navigates by ID', () => {
    const w = new SigningWizardStateMachine(mockFields);
    w.goToFieldById('sig');
    expect(w.currentFieldIndex).toBe(2);
  });
});
