# ============================================================================
# FEDDA RUNPOD IMAGE (GPU-flexible, CUDA 12.4, PyTorch cu124)
# ============================================================================

FROM node:22-alpine AS frontend-builder
COPY . /app
WORKDIR /app/frontend
RUN npm ci --no-audit --no-fund && npm run build

FROM nvidia/cuda:12.4.1-devel-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONIOENCODING=utf-8 \
    CUDA_HOME=/usr/local/cuda \
    LD_LIBRARY_PATH=/usr/local/cuda/lib64:${LD_LIBRARY_PATH} \
    PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True \
    COMFY_PORT=8199 \
    BACKEND_PORT=8000 \
    FRONTEND_PORT=3000 \
    JUPYTER_PORT=8888

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3.11-venv python3.11-dev python3-pip \
    git git-lfs curl wget nginx supervisor ffmpeg rsync \
    build-essential cmake ninja-build \
    libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6 \
    libffi-dev libssl-dev jq ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3.11 /usr/bin/python3 \
    && ln -sf /usr/bin/python3 /usr/bin/python

RUN python3 -m pip install --no-cache-dir --upgrade pip wheel setuptools

# PyTorch cu124 works across common RunPod NVIDIA GPUs (30/40/ADA/50 where supported by drivers)
RUN python3 -m pip install --no-cache-dir \
    torch torchvision torchaudio \
    --index-url https://download.pytorch.org/whl/cu124

# Optional acceleration (never fail whole build)
RUN python3 -m pip install --no-cache-dir xformers --index-url https://download.pytorch.org/whl/cu124 || true
RUN python3 -m pip install --no-cache-dir torchao || true
RUN python3 -m pip install --no-cache-dir sageattention || true

RUN git clone --depth 1 https://github.com/comfyanonymous/ComfyUI.git /app/ComfyUI \
    && cd /app/ComfyUI \
    && python3 -m pip install --no-cache-dir -r requirements.txt

WORKDIR /app/ComfyUI/custom_nodes
RUN git clone --depth 1 https://github.com/ltdrdata/ComfyUI-Manager.git \
    && git clone --depth 1 https://github.com/rgthree/rgthree-comfy.git \
    && git clone --depth 1 https://github.com/comfyanonymous/ComfyUI_bitsandbytes_NF4.git \
    && git clone --depth 1 https://github.com/city96/ComfyUI-GGUF.git \
    && git clone --depth 1 https://github.com/ltdrdata/ComfyUI-Impact-Pack.git

RUN cd /app/ComfyUI/custom_nodes/ComfyUI-Manager && python3 -m pip install --no-cache-dir -r requirements.txt || true
RUN cd /app/ComfyUI/custom_nodes/ComfyUI-Impact-Pack && python3 -m pip install --no-cache-dir -r requirements.txt || true

RUN python3 -m pip install --no-cache-dir \
    insightface \
    diffusers transformers accelerate safetensors sentencepiece \
    onnxruntime-gpu opencv-python-headless pillow tqdm requests psutil \
    fastapi "uvicorn[standard]" python-multipart httpx \
    jupyterlab

COPY --from=frontend-builder /app/backend /app/backend
COPY --from=frontend-builder /app/config /app/config
COPY --from=frontend-builder /app/assets /app/assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

COPY runpod/nginx/nginx.conf /etc/nginx/nginx.conf
COPY runpod/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY runpod/runpod_start.sh /app/runpod_start.sh
COPY runpod/start_comfy.sh /app/start_comfy.sh
RUN chmod +x /app/runpod_start.sh /app/start_comfy.sh

WORKDIR /app
EXPOSE 3000 8199 8888 8000

LABEL org.opencontainers.image.source=https://github.com/Feddakalkun/Fedda_hub-v7
LABEL org.opencontainers.image.description="FEDDA RunPod Studio (ComfyUI + Backend + Frontend)"

ENTRYPOINT ["/app/runpod_start.sh"]
