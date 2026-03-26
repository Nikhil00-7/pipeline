

resource "aws_security_group" "eks_sg" {
  name        = "${var.application}-eks-sg"
  description = "Security group for EKS cluster nodes"
  vpc_id      = var.vpc

  # Allow all outbound traffic by default (recommended for EKS nodes)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound rules
  # 1️⃣ Allow worker nodes to communicate with each other
  ingress {
    description      = "Allow all traffic from self (worker nodes)"
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    self             = true
  }

  # 2️⃣ Allow Kubernetes control plane to communicate with nodes
  ingress {
    description      = "Allow traffic from EKS control plane"
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    # When using managed EKS, you can set source_security_group_id
    # self-managed, leave it open to your control plane CIDRs if known
    cidr_blocks      = ["0.0.0.0/0"] # Replace with actual control plane CIDRs in prod
  }


  tags = {
    Name        = "${var.application}-eks-sg"
    Environment = var.environment
  }
}
