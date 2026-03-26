resource "aws_cloudwatch_log_group" "eks_log_group" {
  name              = "/aws/eks/${var.cluster_name}/cluster"
  retention_in_days = 7
}

resource "aws_security_group" "cluster_sg" {
  name   = "eks_cluster_sg"
  vpc_id = var.vpc_id

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks     = ["0.0.0.0/0"]
    self            = false
    description     = "Allow all outbound traffic"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "node_sg" {
  name   = "eks_node_sg"
  vpc_id = var.vpc_id

  egress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    cidr_blocks     = ["0.0.0.0/0"]
    self            = false
    description     = "Allow all outbound traffic"
  }

  lifecycle {
    create_before_destroy = true
  }
}


resource "aws_security_group_rule" "cluster_to_node" {
    type ="ingress"
    from_port = 1025
    to_port = 65535
    protocol = "tcp"
    security_group_id = aws_security_group.cluster_sg.id
    source_security_group_id = aws_security_group.node_sg.id
     description = "Allow  cluster to communicate with nodes"
}

resource "aws_security_group_rule" "node_to_cluster" {
    type= "ingress"
    from_port = 443
    to_port= 443
    protocol = "tcp"
    security_group_id = aws_security_group.node_sg.id
    source_security_group_id = aws_security_group.cluster_sg.id
    description = "Allow nodes to communicate with cluster"
}

resource "aws_security_group_rule" "node_to_node" {
  type = "ingress"
  from_port = 0
  to_port = 65535
  protocol = "tcp"
  security_group_id = aws_security_group.node_sg.id
  source_security_group_id = aws_security_group.node_sg.id
  description = "Allow nodes to communicate with each other"
}


resource "aws_eks_cluster" "cluster" {
  name     = var.cluster_name
  role_arn = var.cluster_role_arn

  vpc_config {
    subnet_ids              = var.subnet_ids
    endpoint_private_access = var.endpoint_private_access
    endpoint_public_access  = var.endpoint_public_access
    public_access_cidrs     = var.public_access_cidrs
    security_group_ids      = [aws_security_group.cluster_sg.id]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  depends_on                = [aws_cloudwatch_log_group.eks_log_group]
}

data "aws_ssm_parameter" "eks_ami" {
  name = "/aws/service/eks/optimized-ami/${aws_eks_cluster.cluster.version}/amazon-linux-2/recommended/image_id"
} 

resource "aws_launch_template" "eks_nodes" {
  name_prefix   = "${var.cluster_name}-node-"
  image_id      = data.aws_ssm_parameter.eks_ami.value
  instance_type = "t3.medium"


  vpc_security_group_ids = [aws_security_group.node_sg.id]


  user_data = base64encode(<<-EOF
    #!/bin/bash
    /etc/eks/bootstrap.sh ${var.cluster_name}
  EOF
  )


  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"  
  }


  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 50
      volume_type = "gp3"
      encrypted   = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.cluster_name}-node"
    }
  }
}



resource "aws_eks_node_group" "node1" {
  node_group_name = var.node_group_name
  cluster_name    = aws_eks_cluster.cluster.name
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.subnet_ids

  scaling_config {
    max_size       = 5
    min_size       = 1
    desired_size   = 2
  }

  launch_template {
    id      = aws_launch_template.eks_nodes.id
    version = aws_launch_template.eks_nodes.latest_version
  }

   depends_on = [ aws_eks_addon.kube-proxy , aws_eks_addon.cni]
}


resource "aws_eks_addon" "cni" {
   cluster_name = aws_eks_cluster.cluster.name
  addon_name   = "vpc-cni"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"
}


resource "aws_eks_addon" "coredns" {
    cluster_name = aws_eks_cluster.cluster.name
    addon_name   = "coredns"
   resolve_conflicts_on_create = "OVERWRITE"
   resolve_conflicts_on_update = "OVERWRITE"
}

resource "aws_eks_addon" "kube-proxy" {
    cluster_name = aws_eks_cluster.cluster.name
    addon_name   = "kube-proxy"
      resolve_conflicts_on_create = "OVERWRITE"
     resolve_conflicts_on_update = "OVERWRITE"
}

