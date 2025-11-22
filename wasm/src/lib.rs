use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

/// High-performance experience validation (replaces Zod for critical path)
#[wasm_bindgen]
pub struct ExperienceValidator {
    strict_mode: bool,
}

#[wasm_bindgen]
impl ExperienceValidator {
    #[wasm_bindgen(constructor)]
    pub fn new(strict_mode: bool) -> Self {
        Self { strict_mode }
    }

    /// Validate a learning experience JSON string
    /// Returns validation result as JSON
    #[wasm_bindgen]
    pub fn validate(&self, json: &str) -> Result<String, JsValue> {
        let result: Result<Experience, _> = serde_json::from_str(json);

        match result {
            Ok(exp) => {
                let validation_result = self.validate_experience(&exp);
                serde_json::to_string(&validation_result)
                    .map_err(|e| JsValue::from_str(&e.to_string()))
            }
            Err(e) => {
                let error = ValidationResult {
                    valid: false,
                    errors: vec![format!("Parse error: {}", e)],
                };
                serde_json::to_string(&error)
                    .map_err(|e| JsValue::from_str(&e.to_string()))
            }
        }
    }

    fn validate_experience(&self, exp: &Experience) -> ValidationResult {
        let mut errors = Vec::new();

        // Required fields
        if exp.id.is_empty() {
            errors.push("id is required".to_string());
        }
        if exp.timestamp.is_empty() {
            errors.push("timestamp is required".to_string());
        }
        if exp.learner.id.is_empty() {
            errors.push("learner.id is required".to_string());
        }
        if exp.context.location.name.is_empty() {
            errors.push("context.location.name is required".to_string());
        }
        if exp.experience.type_field.is_empty() {
            errors.push("experience.type is required".to_string());
        }
        if exp.experience.description.is_empty() {
            errors.push("experience.description is required".to_string());
        }

        // Validate coordinates if present
        if let Some(ref coords) = exp.context.location.coordinates {
            if coords.latitude < -90.0 || coords.latitude > 90.0 {
                errors.push("latitude must be between -90 and 90".to_string());
            }
            if coords.longitude < -180.0 || coords.longitude > 180.0 {
                errors.push("longitude must be between -180 and 180".to_string());
            }
        }

        ValidationResult {
            valid: errors.is_empty(),
            errors,
        }
    }
}

/// High-performance domain network generation
#[wasm_bindgen]
pub fn generate_domain_network(experiences_json: &str) -> Result<String, JsValue> {
    let experiences: Vec<Experience> = serde_json::from_str(experiences_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let network = build_network(&experiences);

    serde_json::to_string(&network)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

fn build_network(experiences: &[Experience]) -> DomainNetwork {
    let mut nodes: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    let mut edges: std::collections::HashMap<(String, String), usize> = std::collections::HashMap::new();

    for exp in experiences {
        if let Some(ref domains) = exp.experience.domains {
            // Count node occurrences
            for domain in domains {
                *nodes.entry(domain.clone()).or_insert(0) += 1;
            }

            // Count edge occurrences
            for i in 0..domains.len() {
                for j in (i + 1)..domains.len() {
                    let mut pair = (domains[i].clone(), domains[j].clone());
                    if pair.0 > pair.1 {
                        pair = (pair.1, pair.0);
                    }
                    *edges.entry(pair).or_insert(0) += 1;
                }
            }
        }
    }

    let network_nodes: Vec<NetworkNode> = nodes
        .into_iter()
        .map(|(id, size)| NetworkNode { id, size })
        .collect();

    let network_edges: Vec<NetworkEdge> = edges
        .into_iter()
        .map(|((source, target), weight)| NetworkEdge {
            source,
            target,
            weight,
        })
        .collect();

    DomainNetwork {
        nodes: network_nodes,
        edges: network_edges,
    }
}

/// High-performance Jaccard similarity calculation
#[wasm_bindgen]
pub fn jaccard_similarity(set1_json: &str, set2_json: &str) -> Result<f64, JsValue> {
    let set1: Vec<String> = serde_json::from_str(set1_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let set2: Vec<String> = serde_json::from_str(set2_json)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let set1: std::collections::HashSet<_> = set1.into_iter().collect();
    let set2: std::collections::HashSet<_> = set2.into_iter().collect();

    let intersection = set1.intersection(&set2).count();
    let union = set1.union(&set2).count();

    if union == 0 {
        Ok(0.0)
    } else {
        Ok(intersection as f64 / union as f64)
    }
}

// Data structures
#[derive(Serialize, Deserialize)]
struct Experience {
    id: String,
    timestamp: String,
    learner: Learner,
    context: Context,
    experience: ExperienceData,
}

#[derive(Serialize, Deserialize)]
struct Learner {
    id: String,
}

#[derive(Serialize, Deserialize)]
struct Context {
    location: Location,
}

#[derive(Serialize, Deserialize)]
struct Location {
    name: String,
    coordinates: Option<Coordinates>,
}

#[derive(Serialize, Deserialize)]
struct Coordinates {
    latitude: f64,
    longitude: f64,
}

#[derive(Serialize, Deserialize)]
struct ExperienceData {
    #[serde(rename = "type")]
    type_field: String,
    description: String,
    domains: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize)]
struct ValidationResult {
    valid: bool,
    errors: Vec<String>,
}

#[derive(Serialize, Deserialize)]
struct DomainNetwork {
    nodes: Vec<NetworkNode>,
    edges: Vec<NetworkEdge>,
}

#[derive(Serialize, Deserialize)]
struct NetworkNode {
    id: String,
    size: usize,
}

#[derive(Serialize, Deserialize)]
struct NetworkEdge {
    source: String,
    target: String,
    weight: usize,
}
