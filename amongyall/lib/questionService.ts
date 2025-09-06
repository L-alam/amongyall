import { supabase } from './supabase';

export interface QuestionSet {
  id: string;
  name: string;
  is_premium: boolean;
  is_custom: boolean;
  created_by?: string;
  created_at?: string;
}

export interface Question {
  id: string;
  set_id: string;
  main_question: string;
  spy_question: string;
  created_at?: string;
}

export interface QuestionPair {
  normal: string;
  spy: string;
}

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: QuestionPair[];
}

// Get all question sets
export const getAllQuestionSets = async (): Promise<QuestionSet[]> => {
  const { data, error } = await supabase
    .from('question_set')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching question sets:', error);
    throw error;
  }

  return data || [];
};

// Get all question set names
export const getAllQuestionSetNames = async (): Promise<string[]> => {
  const questionSets = await getAllQuestionSets();
  return questionSets.map(set => set.name);
};

// Get questions for a specific set by name
export const getQuestionsBySetName = async (setName: string): Promise<QuestionPair[]> => {
  const { data, error } = await supabase
    .from('question_set')
    .select(`
      id,
      questions (
        main_question,
        spy_question
      )
    `)
    .eq('name', setName)
    .single();

  if (error) {
    console.error('Error fetching questions for set:', error);
    throw error;
  }

  if (!data || !data.questions) {
    return [];
  }

  return data.questions.map((item: any) => ({
    normal: item.main_question,
    spy: item.spy_question
  }));
};

// Get questions for a specific set by ID
export const getQuestionsBySetId = async (setId: string): Promise<QuestionPair[]> => {
  const { data, error } = await supabase
    .from('questions')
    .select('main_question, spy_question')
    .eq('set_id', setId)
    .order('main_question');

  if (error) {
    console.error('Error fetching questions for set:', error);
    throw error;
  }

  return data?.map(item => ({
    normal: item.main_question,
    spy: item.spy_question
  })) || [];
};

// Get random questions from a set
export const getRandomQuestionsFromSet = async (setName: string, count: number): Promise<QuestionPair[]> => {
  const questions = await getQuestionsBySetName(setName);
  
  if (questions.length === 0) return [];
  
  // Shuffle the array and take the requested count
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, questions.length));
};

// Get a random preview of questions from a set (typically 3 for preview)
export const getRandomPreviewQuestions = async (setName: string): Promise<QuestionPair[]> => {
  return getRandomQuestionsFromSet(setName, 1);
};

// Get a question set with all its questions
export const getQuestionSetWithQuestions = async (setName: string): Promise<QuestionSetWithQuestions | null> => {
  const { data, error } = await supabase
    .from('question_set')
    .select(`
      *,
      questions (
        main_question,
        spy_question
      )
    `)
    .eq('name', setName)
    .single();

  if (error) {
    console.error('Error fetching question set with questions:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    questions: data.questions?.map((item: any) => ({
      normal: item.main_question,
      spy: item.spy_question
    })) || []
  };
};

// Get question sets by category (if needed for filtering)
export const getQuestionSetsByCategory = async (category: string): Promise<QuestionSet[]> => {
  // If you add a category column to question_set table, you can filter by it
  // For now, this is a placeholder that returns all sets
  return getAllQuestionSets();
};

// Get a single random question pair from a set
export const getRandomQuestionPair = async (setName: string): Promise<QuestionPair | null> => {
  const questions = await getRandomQuestionsFromSet(setName, 1);
  return questions.length > 0 ? questions[0] : null;
};