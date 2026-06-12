import os
import glob
import logging
from datetime import datetime
from backend.agents.state import AgentState
from backend.llm.gemini_client import generate_agent_response

logger = logging.getLogger("causalguard.rag")

# In-memory storage for LlamaIndex or Fallback
RAG_INDEX = None
RAG_USE_FALLBACK = True
KNOWLEDGE_BASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge_base")

def init_rag_index():
    global RAG_INDEX, RAG_USE_FALLBACK
    
    # Check if knowledge base directory exists, create if missing
    if not os.path.exists(KNOWLEDGE_BASE_DIR):
        os.makedirs(KNOWLEDGE_BASE_DIR)
        
    try:
        # Check environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("No GEMINI_API_KEY found. Defaulting to local keyword RAG engine.")
            RAG_USE_FALLBACK = True
            return

        # Attempt to import LlamaIndex
        from llama_index.core import SimpleDirectoryReader, VectorStoreIndex
        from llama_index.llms.gemini import Gemini
        from llama_index.core import Settings
        
        # Configure LlamaIndex to use Gemini (try multiple model options if one fails)
        llm = None
        for model_name in ["models/gemini-1.5-flash", "models/gemini-1.5-flash-latest", "models/gemini-2.0-flash-exp", "models/gemini-pro"]:
            try:
                llm = Gemini(model=model_name, api_key=api_key)
                logger.info(f"Successfully configured LlamaIndex LLM with model: {model_name}")
                break
            except Exception as e:
                logger.warning(f"LlamaIndex Gemini model {model_name} initialization failed: {e}. Trying next option...")
        
        if not llm:
            raise ValueError("All candidate Gemini models failed to initialize.")
            
        Settings.llm = llm
        
        # Use a lightweight fast embedding model
        from llama_index.embeddings.huggingface import HuggingFaceEmbedding
        Settings.embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
        
        # Read files from knowledge base
        reader = SimpleDirectoryReader(input_dir=KNOWLEDGE_BASE_DIR)
        documents = reader.load_data()
        
        if documents:
            RAG_INDEX = VectorStoreIndex.from_documents(documents)
            RAG_USE_FALLBACK = False
            logger.info(f"LlamaIndex initialized successfully with {len(documents)} documents.")
        else:
            RAG_USE_FALLBACK = True
            logger.info("Knowledge base is empty. Using local fallback RAG.")
    except Exception as e:
        logger.error(f"Failed to initialize LlamaIndex: {e}. Falling back to file-based keyword search.")
        RAG_USE_FALLBACK = True

def query_rag_fallback(query: str) -> dict:
    """
    Simulates a Vector Database query by searching for keyword matches in local
    knowledge_base markdown files. Extremely robust and requires zero dependencies.
    """
    query_lower = query.lower()
    best_file = ""
    best_context = ""
    max_matches = 0
    
    # List all markdown files
    files = glob.glob(os.path.join(KNOWLEDGE_BASE_DIR, "*.md"))
    for file_path in files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            # Count keyword occurrences
            matches = 0
            # Simple keyword extraction
            words = query_lower.split()
            for w in words:
                if len(w) > 3:
                    matches += content.lower().count(w)
                    
            if matches > max_matches:
                max_matches = matches
                best_file = os.path.basename(file_path)
                # Extract the most relevant section (or return first 800 chars)
                best_context = content[:1000]
        except Exception as e:
            logger.error(f"Error reading RAG file {file_path}: {e}")
            
    if best_file:
        return {
            "retrieved_context": best_context,
            "sources": [best_file],
            "citations": [f"{best_file} - Section 1"]
        }
        
    return {
        "retrieved_context": "No specific local guideline matches found. Standard emergency procedures apply: Dial 112 for ERS support.",
        "sources": ["helpline_information.md"],
        "citations": ["helpline_information.md - Default Fallback"]
    }

def run_rag_agent(state: AgentState) -> AgentState:
    scheduled = state.get("agent_outputs", {}).get("scheduled_agents", [])
    # Always run RAG if context is empty or explicitly requested
    if "RAG Knowledge Agent" not in scheduled and state.get("rag_context", "") != "":
        return state

    query = state["message"]
    
    if RAG_USE_FALLBACK or not RAG_INDEX:
        res = query_rag_fallback(query)
    else:
        try:
            query_engine = RAG_INDEX.as_query_engine(similarity_top_k=2)
            response = query_engine.query(query)
            
            # Extract cited source documents
            sources = []
            for node in response.source_nodes:
                meta = node.node.metadata
                file_name = meta.get("file_name")
                if file_name and file_name not in sources:
                    sources.append(file_name)
                    
            res = {
                "retrieved_context": str(response),
                "sources": sources if sources else ["women_safety_guidelines.md"],
                "citations": [f"{s} (Vector Search Match)" for s in sources]
            }
        except Exception as e:
            logger.error(f"LlamaIndex query failed: {e}. Using fallback.")
            res = query_rag_fallback(query)
            
    state["rag_context"] = res.get("retrieved_context", "")
    state["agent_outputs"]["rag_agent"] = res
    return state
